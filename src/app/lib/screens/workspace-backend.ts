import fs from 'fs-extra';
import path from 'path';
import {
  compareRecords,
  isAfter,
  isStorageName,
  type CollectionScope,
  type CollectionsBackend,
  type DocumentOwnerKind,
  type StoredRecord,
} from '@handoff/screens/store';
import { ScreenDataError } from '@handoff/screens/types';

/**
 * The workspace backing of collections: one JSON file per document at
 * `handoff/data/<owner kind>/<owner id>/<collection>/<id>.json`, for example
 * `handoff/data/screens/notes/items/abc.json`, so a developer can read, edit and commit the data.
 *
 * A file holds the document under `data` and its revision and timestamps beside it. A hand-written
 * file may leave the metadata out; it then reads as revision 1 at the current version.
 */

const OWNER_DIRECTORIES: Record<DocumentOwnerKind, string> = { screen: 'screens' };

const dataRoot = (): string => path.resolve(process.env.HANDOFF_WORKING_PATH ?? process.cwd(), 'handoff', 'data');

// Each part becomes a path segment, so a name with a separator or `..` must never reach `path.join`.
const segment = (value: string, what: string): string => {
  if (!isStorageName(value)) throw new ScreenDataError('invalid', `The ${what} ${JSON.stringify(value)} cannot be stored.`);
  return value;
};

const directoryOf = (scope: CollectionScope): string =>
  path.join(dataRoot(), OWNER_DIRECTORIES[scope.ownerKind], segment(scope.ownerId, 'owner id'), segment(scope.collection, 'collection'));

const fileOf = (scope: CollectionScope, id: string): string => path.join(directoryOf(scope), `${segment(id, 'document id')}.json`);

const readRecord = async (file: string, id: string): Promise<StoredRecord | null> => {
  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ScreenDataError('invalid', `${path.relative(process.cwd(), file)} is not valid JSON. Fix or delete the file.`);
  }
  const stat = await fs.stat(file);
  const hasEnvelope = parsed && typeof parsed === 'object' && 'data' in parsed;
  const text = (value: unknown, fallback: string) => (typeof value === 'string' ? value : fallback);
  return {
    id,
    data: hasEnvelope ? parsed.data : parsed,
    schemaVersion: hasEnvelope && typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1,
    revision: hasEnvelope && typeof parsed.revision === 'number' ? parsed.revision : 1,
    createdAt: text(hasEnvelope && parsed.createdAt, stat.birthtime.toISOString()),
    updatedAt: text(hasEnvelope && parsed.updatedAt, stat.mtime.toISOString()),
    createdBy: null,
    updatedBy: null,
  };
};

/** Writes to one collection run one at a time, so a revision check and its write cannot interleave. */
const queues = new Map<string, Promise<unknown>>();
const serialized = <T>(scope: CollectionScope, task: () => Promise<T>): Promise<T> => {
  const queueKey = `${scope.ownerKind}/${scope.ownerId}/${scope.collection}`;
  const run = (queues.get(queueKey) ?? Promise.resolve()).catch(() => undefined).then(task);
  queues.set(queueKey, run);
  return run;
};

const matches = (data: unknown, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([key, value]) => (data as Record<string, unknown> | null)?.[key] === value);

export const workspaceCollectionsBackend: CollectionsBackend = {
  async get(scope, id) {
    return readRecord(fileOf(scope, id), id);
  },

  async list(scope, query) {
    const directory = directoryOf(scope);
    if (!(await fs.pathExists(directory))) return [];
    // A file whose name is not a valid id, such as `Notes.json`, could not be read back by id, so it is not listed.
    const ids = (await fs.readdir(directory))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -'.json'.length))
      .filter(isStorageName);
    const records = (await Promise.all(ids.map((id) => readRecord(path.join(directory, `${id}.json`), id)))).filter(
      (record): record is StoredRecord => record !== null && matches(record.data, query.where)
    );
    return records
      .sort(compareRecords(query.sort, query.order))
      .filter((record) => isAfter(record, query))
      .slice(0, query.limit + 1);
  },

  write(scope, input, { expectedRevision }) {
    return serialized(scope, async () => {
      const file = fileOf(scope, input.id);
      const current = await readRecord(file, input.id);
      if (expectedRevision === 0 && current) throw new ScreenDataError('conflict', `Document "${input.id}" already exists.`);
      if (expectedRevision !== undefined && expectedRevision > 0) {
        if (!current) throw new ScreenDataError('not_found', `Document "${input.id}" does not exist.`);
        if (current.revision !== expectedRevision) {
          throw new ScreenDataError(
            'conflict',
            `Document "${input.id}" changed since revision ${expectedRevision}; it is at revision ${current.revision}.`
          );
        }
      }
      const now = new Date().toISOString();
      const record: StoredRecord = {
        id: input.id,
        data: input.data,
        schemaVersion: input.schemaVersion,
        revision: (current?.revision ?? 0) + 1,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
        createdBy: null,
        updatedBy: null,
      };
      await fs.ensureDir(path.dirname(file));
      // Written to a temporary file and renamed, so a reader never sees half a document.
      const temporary = `${file}.${process.pid}.tmp`;
      const { id: _id, createdBy: _createdBy, updatedBy: _updatedBy, ...stored } = record;
      await fs.writeFile(temporary, `${JSON.stringify(stored, null, 2)}\n`);
      await fs.rename(temporary, file);
      return record;
    });
  },

  remove(scope, id, { expectedRevision }) {
    return serialized(scope, async () => {
      const file = fileOf(scope, id);
      const current = await readRecord(file, id);
      if (!current) return false;
      if (expectedRevision !== undefined && current.revision !== expectedRevision) {
        throw new ScreenDataError('conflict', `Document "${id}" changed since revision ${expectedRevision}.`);
      }
      await fs.remove(file);
      return true;
    });
  },
};
