import type { AnyCollection } from './define';
import { createInstanceId } from './instances';
import {
  ScreenDataError,
  type CollectionPage,
  type CollectionQuery,
  type CollectionSort,
  type CollectionStore,
  type StoredDocument,
} from './types';
import { describeIssues, validateValue } from './validate';

/**
 * The typed collection store, written once over {@link CollectionsBackend}. The workspace backs it
 * with files and the registry with the `documents` table, so every rule here (validation,
 * upgrades, revisions, limits) holds in both modes. Pure: no Node or database imports.
 */

/** One stored document as a backend keeps it. */
export interface StoredRecord {
  id: string;
  data: unknown;
  schemaVersion: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * The kind of thing that owns collections. Each kind has its own namespace in both backings, so a
 * new kind never collides with screen ids. The app sets it; a screen cannot choose it.
 */
export type DocumentOwnerKind = 'screen';

/**
 * Where a collection is stored. Every part is a lowercase name (see {@link isStorageName}), because
 * the workspace backing uses each one as a path segment on a filesystem that may ignore case.
 */
export interface CollectionScope {
  ownerKind: DocumentOwnerKind;
  ownerId: string;
  collection: string;
}

export interface BackendQuery {
  where: Record<string, string | number | boolean>;
  sort: CollectionSort;
  order: 'asc' | 'desc';
  limit: number;
  /** Return records after this sort key. */
  after: { value: string; id: string } | null;
}

/**
 * Storage for collection documents. A conditional write or delete throws
 * `ScreenDataError('conflict')` when the stored revision differs from `expectedRevision`
 * (`0`: the document must not exist).
 */
export interface CollectionsBackend {
  get(scope: CollectionScope, id: string): Promise<StoredRecord | null>;
  /** At most `limit + 1` records, so the caller can tell whether another page follows. */
  list(scope: CollectionScope, query: BackendQuery): Promise<StoredRecord[]>;
  write(
    scope: CollectionScope,
    input: { id: string; data: unknown; schemaVersion: number },
    options: { expectedRevision?: number; actor: string | null }
  ): Promise<StoredRecord>;
  remove(scope: CollectionScope, id: string, options: { expectedRevision?: number }): Promise<boolean>;
}

export const MAX_DOCUMENT_BYTES = 256 * 1024;
export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = 200;
const UPDATE_ATTEMPTS = 5;
// Lowercase only: a registry tells `Abc` from `abc`, but the default macOS and Windows filesystems do not.
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const SORTS: CollectionSort[] = ['createdAt', 'updatedAt', 'id'];

export const isDocumentId = (id: unknown): id is string => typeof id === 'string' && ID_PATTERN.test(id);

/** Whether a value is safe as one storage key part: an owner id, a collection name or a document id. */
export const isStorageName = (value: unknown): value is string => typeof value === 'string' && ID_PATTERN.test(value);

const assertId = (id: unknown): string => {
  if (!isDocumentId(id)) {
    throw new ScreenDataError('invalid', `Document id ${JSON.stringify(id)} is invalid. Use up to 128 lowercase letters, digits, "-" and "_".`);
  }
  return id;
};

/** The sort key of a record, as the backends compare it. */
export const sortValue = (record: StoredRecord, sort: CollectionSort): string => (sort === 'id' ? record.id : record[sort]);

export const encodeCursor = (record: StoredRecord, sort: CollectionSort): string => JSON.stringify([sortValue(record, sort), record.id]);

const decodeCursor = (cursor: string | undefined): BackendQuery['after'] => {
  if (!cursor) return null;
  try {
    const [value, id] = JSON.parse(cursor);
    if (typeof value === 'string' && typeof id === 'string') return { value, id };
  } catch {
    // Reported below.
  }
  throw new ScreenDataError('invalid', 'The cursor is invalid. Pass `nextCursor` from the previous page unchanged.');
};

/** Check a query from any caller and fill its defaults. */
export const normalizeQuery = (query: CollectionQuery<unknown> = {}): BackendQuery => {
  const where: BackendQuery['where'] = {};
  for (const [key, value] of Object.entries(query.where ?? {})) {
    if (value === undefined) continue;
    if (!/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(key) || !['string', 'number', 'boolean'].includes(typeof value)) {
      throw new ScreenDataError(
        'invalid',
        `Filter "${key}" is invalid. Filter on top-level fields with a string, number or boolean value.`
      );
    }
    where[key] = value as string | number | boolean;
  }
  const sort = query.sort ?? 'createdAt';
  if (!SORTS.includes(sort)) throw new ScreenDataError('invalid', `Sort "${sort}" is invalid. Sort by ${SORTS.join(', ')}.`);
  const order = query.order ?? 'asc';
  if (order !== 'asc' && order !== 'desc') throw new ScreenDataError('invalid', 'Order must be "asc" or "desc".');
  const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, Math.trunc(Number(query.limit ?? DEFAULT_LIST_LIMIT)) || DEFAULT_LIST_LIMIT));
  return { where, sort, order, limit, after: decodeCursor(query.cursor) };
};

/** The order and paging the backends share; the workspace applies it in memory. */
export const compareRecords =
  (sort: CollectionSort, order: 'asc' | 'desc') =>
  (a: StoredRecord, b: StoredRecord): number => {
    const byValue = sortValue(a, sort).localeCompare(sortValue(b, sort)) || a.id.localeCompare(b.id);
    return order === 'asc' ? byValue : -byValue;
  };

export const isAfter = (record: StoredRecord, query: BackendQuery): boolean => {
  if (!query.after) return true;
  const value = sortValue(record, query.sort);
  const byValue = value.localeCompare(query.after.value) || record.id.localeCompare(query.after.id);
  return query.order === 'asc' ? byValue > 0 : byValue < 0;
};

export interface StoreContext {
  backend: CollectionsBackend;
  ownerKind: DocumentOwnerKind;
  ownerId: string;
  /** The user id recorded as author; `null` in a workspace. */
  actor: string | null;
  /** Whether the caller may write. Reads that upgrade a document write it back regardless. */
  canWrite: boolean;
}

const sizeOf = (value: unknown): number => new TextEncoder().encode(JSON.stringify(value)).length;

export const createCollectionStore = <Doc>(collection: AnyCollection, context: StoreContext): CollectionStore<Doc> => {
  const scope: CollectionScope = { ownerKind: context.ownerKind, ownerId: context.ownerId, collection: collection.name };

  const toDocument = (record: StoredRecord): StoredDocument<Doc> => ({
    id: record.id,
    data: record.data as Doc,
    revision: record.revision,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy ? { id: record.createdBy } : null,
    updatedBy: record.updatedBy ? { id: record.updatedBy } : null,
    ref: { collection: collection.name, id: record.id, revision: record.revision },
  });

  const check = (data: unknown): void => {
    const issues = validateValue(collection.schema, data);
    if (issues.length > 0) {
      throw new ScreenDataError('invalid', `The document does not match collection "${collection.name}". ${describeIssues(issues)}`);
    }
    const size = sizeOf(data);
    if (size > MAX_DOCUMENT_BYTES) {
      throw new ScreenDataError(
        'too_large',
        `The document is ${size} bytes; a document holds at most ${MAX_DOCUMENT_BYTES}. Split it across documents.`
      );
    }
  };

  const requireWrite = (): void => {
    if (!context.canWrite) throw new ScreenDataError('forbidden', `You cannot change "${collection.name}" on this screen.`);
  };

  /** Bring an older document to the current version and write it back, so the upgrade runs once. */
  const upgrade = async (record: StoredRecord): Promise<StoredRecord> => {
    if (record.schemaVersion >= collection.version) return record;
    let data = record.data;
    for (let version = record.schemaVersion + 1; version <= collection.version; version++) {
      const step = collection.migrate?.[version];
      if (typeof step !== 'function') {
        throw new ScreenDataError(
          'invalid',
          `Document "${record.id}" is at version ${record.schemaVersion} of "${collection.name}", but there is no migrate step for version ${version}.`
        );
      }
      data = step(structuredClone(data));
    }
    const issues = validateValue(collection.schema, data);
    if (issues.length > 0) {
      throw new ScreenDataError(
        'invalid',
        `Upgrading document "${record.id}" of "${collection.name}" gave an invalid document. ${describeIssues(issues)}`
      );
    }
    try {
      return await context.backend.write(
        scope,
        { id: record.id, data, schemaVersion: collection.version },
        { expectedRevision: record.revision, actor: null }
      );
    } catch (error) {
      // Another reader upgraded it first.
      if (error instanceof ScreenDataError && error.code === 'conflict') {
        const current = await context.backend.get(scope, record.id);
        if (current) return upgrade(current);
      }
      throw error;
    }
  };

  const read = async (id: string): Promise<StoredRecord | null> => {
    const record = await context.backend.get(scope, assertId(id));
    return record ? upgrade(record) : null;
  };

  const write = async (id: string, data: unknown, expectedRevision?: number): Promise<StoredDocument<Doc>> => {
    requireWrite();
    check(data);
    const record = await context.backend.write(
      scope,
      { id: assertId(id), data, schemaVersion: collection.version },
      { expectedRevision, actor: context.actor }
    );
    return toDocument(record);
  };

  return {
    async get(id) {
      const record = await read(id);
      return record ? toDocument(record) : null;
    },
    async list(query): Promise<CollectionPage<Doc>> {
      const normalized = normalizeQuery(query as CollectionQuery<unknown>);
      const records = await context.backend.list(scope, normalized);
      const page = records.slice(0, normalized.limit);
      const documents = await Promise.all(page.map((record) => upgrade(record).then(toDocument)));
      const last = page[page.length - 1];
      return { documents, nextCursor: records.length > normalized.limit && last ? encodeCursor(last, normalized.sort) : null };
    },
    async create(data, options) {
      return write(options?.id ?? createInstanceId(), data, 0);
    },
    async put(id, data, options) {
      return write(id, data, options?.revision);
    },
    async update(id, change) {
      requireWrite();
      for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt++) {
        const current = await read(id);
        if (!current) throw new ScreenDataError('not_found', `Document "${id}" does not exist in "${collection.name}".`);
        const next = change(structuredClone(current.data) as Doc);
        try {
          return await write(id, next, current.revision);
        } catch (error) {
          if (!(error instanceof ScreenDataError && error.code === 'conflict')) throw error;
        }
      }
      throw new ScreenDataError('conflict', `Document "${id}" kept changing while it was updated. Try again.`);
    },
    async remove(id, options) {
      requireWrite();
      return context.backend.remove(scope, assertId(id), { expectedRevision: options?.revision });
    },
  };
};
