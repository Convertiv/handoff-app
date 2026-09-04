import { and, eq } from 'drizzle-orm';
import matter from 'gray-matter';
import { normalizePageDeclaration } from '@handoff/config/normalizers/page';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import {
  buildMetadata,
  componentFiles,
  components,
  docsArtifacts,
  pageFiles,
  pages,
  patternFiles,
  patterns,
  type RegistryReviewMetadata,
} from '@handoff/registry/db/schema';
import { hashPathValues } from '@handoff/registry/publish/publish-build';
import { parseMarkdown } from '@handoff/utils/markdown';
import type { ComponentListObject, PageListObject, PatternListObject } from '@handoff/transformers/preview/types';
import { mergeReviewMetadata, type ManagedEntityKind, type ValidatedMetadataWrite } from './allowlist';
import type { ValidatedFile } from './files';
import { resolveBuildMeta, type RegistryBuildMeta } from './meta';

/**
 * Database operations behind the registry management API.
 *
 * Reads return the normalized record merged with registry-only review metadata; writes are limited
 * to the metadata allowlist and the text-file record groups. Crucially, metadata create/update
 * never touches `docs_artifacts` or `build_metadata` — published artifacts and build state are only
 * changed by transfer/publish. Pages are the one exception: their markdown frontmatter *is* the
 * record's source, so a page edit writes both rows and re-hashes the file (see
 * {@link updatePageMetadata}). Entity deletion removes only that entity's owned artifacts;
 * shared/global artifacts (owned by `asset`) are preserved.
 */

/** A registry record as served by the management API: the normalized record plus review metadata. */
export type RegistryEntityData = Record<string, unknown> & { metadata: RegistryReviewMetadata | null };

/** A single entity read result: its served data plus build/artifact state. */
export interface EntityReadResult {
  data: RegistryEntityData;
  build: RegistryBuildMeta;
}

/** Binds an entity kind to its tables and the conventions used to build/store its records. */
interface EntitySpec {
  table: typeof components | typeof patterns | typeof pages;
  filesTable: typeof componentFiles | typeof patternFiles | typeof pageFiles;
  fileFkColumn: typeof componentFiles.componentId;
  fileFkName: 'componentId' | 'patternId' | 'pageId';
}

const ENTITY: Record<ManagedEntityKind, EntitySpec> = {
  component: {
    table: components,
    filesTable: componentFiles,
    fileFkColumn: componentFiles.componentId,
    fileFkName: 'componentId',
  },
  pattern: {
    table: patterns,
    filesTable: patternFiles as unknown as typeof componentFiles,
    fileFkColumn: patternFiles.patternId as unknown as typeof componentFiles.componentId,
    fileFkName: 'patternId',
  },
  page: {
    table: pages,
    filesTable: pageFiles as unknown as typeof componentFiles,
    fileFkColumn: pageFiles.pageId as unknown as typeof componentFiles.componentId,
    fileFkName: 'pageId',
  },
};

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const asStringArray = (value: unknown): string[] | undefined => (Array.isArray(value) ? (value as string[]) : undefined);

/** Attach review metadata to a normalized record for serving. */
const withMetadata = (record: unknown, metadata: RegistryReviewMetadata | null | undefined): RegistryEntityData => ({
  ...(record as Record<string, unknown>),
  metadata: metadata ?? null,
});

/** Build a minimal, valid metadata-only component record from allowlisted fields. */
const buildComponentRecord = (id: string, path: string, fields: Record<string, unknown>): ComponentListObject => ({
  id,
  path,
  title: asString(fields.title) ?? id,
  description: asString(fields.description) ?? '',
  image: '',
  group: asString(fields.group) ?? '',
  type: '',
  properties: {},
  previews: {},
  ...(asStringArray(fields.tags) ? { tags: asStringArray(fields.tags) } : {}),
  ...(asStringArray(fields.categories) ? { categories: asStringArray(fields.categories) } : {}),
});

/** Build a minimal, valid metadata-only pattern record from allowlisted fields. */
const buildPatternRecord = (id: string, path: string, fields: Record<string, unknown>): PatternListObject => ({
  id,
  path,
  title: asString(fields.title) ?? id,
  description: asString(fields.description) ?? '',
  group: asString(fields.group) ?? '',
  components: [],
  ...(asStringArray(fields.tags) ? { tags: asStringArray(fields.tags) } : {}),
});

/** Normalize page frontmatter without persisting its workspace-only source path. */
const normalizeManagedPageRecord = (id: string, path: string, frontmatter: Record<string, unknown>): PageListObject => {
  const { sourcePath: _sourcePath, ...record } = normalizePageDeclaration(frontmatter, { id, routePath: path, sourcePath: '' });
  return record;
};

/** Whether an entity exists by id. */
export const entityExists = async (db: RegistryDatabase, kind: ManagedEntityKind, id: string): Promise<boolean> => {
  const spec = ENTITY[kind];
  const rows = await db.select({ id: spec.table.id }).from(spec.table).where(eq(spec.table.id, id)).limit(1);
  return Boolean(rows[0]);
};

/** List all entities of a kind, each merged with its review metadata. */
export const listEntities = async (db: RegistryDatabase, kind: ManagedEntityKind): Promise<RegistryEntityData[]> => {
  const spec = ENTITY[kind];
  const rows = await db.select({ record: spec.table.record, metadata: spec.table.metadata }).from(spec.table);
  return rows.map((row) => withMetadata(row.record, row.metadata));
};

/** Read a single entity with its build/artifact state, or `null` when absent. */
export const getEntity = async (db: RegistryDatabase, kind: ManagedEntityKind, id: string): Promise<EntityReadResult | null> => {
  const spec = ENTITY[kind];
  const rows = await db
    .select({ record: spec.table.record, metadata: spec.table.metadata })
    .from(spec.table)
    .where(eq(spec.table.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  return { data: withMetadata(row.record, row.metadata), build: await resolveBuildMeta(db, kind, id) };
};

/** Create a metadata-only entity record. Returns `null` when an entity with that id already exists. */
export const createEntity = async (
  db: RegistryDatabase,
  kind: ManagedEntityKind,
  write: ValidatedMetadataWrite
): Promise<EntityReadResult | null> => {
  const spec = ENTITY[kind];
  const id = write.id as string;
  const path = kind === 'page' ? `/${id}` : `${kind}/${id}`;
  const { fields } = write;
  const metadata = write.metadata ?? null;
  const record =
    kind === 'component'
      ? buildComponentRecord(id, path, fields)
      : kind === 'pattern'
        ? buildPatternRecord(id, path, fields)
        : normalizeManagedPageRecord(id, path, fields);

  // `tags` is promoted on components/patterns only; the pages table has no such column.
  const baseValues = {
    id,
    path,
    title: asString(fields.title),
    description: asString(fields.description),
    group: asString(fields.group),
    record,
    metadata,
  };
  const values =
    kind === 'component'
      ? { ...baseValues, tags: asStringArray(fields.tags), type: '', categories: asStringArray(fields.categories) }
      : kind === 'pattern'
        ? { ...baseValues, tags: asStringArray(fields.tags), components: [] }
        : baseValues;

  const inserted = await db
    .insert(spec.table)
    .values(values as any)
    .onConflictDoNothing({ target: spec.table.id })
    .returning({ id: spec.table.id });
  if (inserted.length === 0) {
    return null;
  }
  return { data: withMetadata(record, metadata), build: await resolveBuildMeta(db, kind, id) };
};

/**
 * Apply a page metadata update to the frontmatter, the record, and the source hash together.
 *
 * A page's `.md` frontmatter is the only source its record is ever derived from, so writing
 * `pages.record` alone drifts from `page_files.content`: a checkout hands the workspace the stale
 * frontmatter and the next publish reverts the edit, while `sourceHash` — hashed from file content —
 * still reports the two sides as matching. Merging the edit into the frontmatter, re-deriving the
 * record from it, and re-hashing the file keeps all three honest, so the edit survives a round trip
 * and a bulk publish sees the page as changed.
 */
const updatePageMetadata = async (db: RegistryDatabase, id: string, write: ValidatedMetadataWrite): Promise<EntityReadResult | null> => {
  const rows = await db
    .select({ path: pages.path, record: pages.record, metadata: pages.metadata })
    .from(pages)
    .where(eq(pages.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const files = await db.select({ path: pageFiles.path, content: pageFiles.content }).from(pageFiles).where(eq(pageFiles.pageId, id));
  // A page carries a single verbatim `.md`; a metadata-only page (created, never published) has none.
  const source = files.find((file) => file.content != null);
  const hasFrontmatterChanges = Object.keys(write.fields).length > 0;
  const parsed = hasFrontmatterChanges ? parseMarkdown(source?.content ?? '') : null;
  const frontmatter = parsed ? { ...parsed.data, ...write.fields } : null;
  const record = frontmatter ? normalizeManagedPageRecord(id, row.path || `/${id}`, frontmatter) : row.record;
  const metadata = mergeReviewMetadata(row.metadata, write.metadata);
  const content = source && parsed && frontmatter ? matter.stringify(parsed.content, frontmatter) : null;

  await db.transaction(async (tx) => {
    const transactionalDb = tx as unknown as RegistryDatabase;
    await transactionalDb
      .update(pages)
      .set({
        title: record.title,
        description: record.description ?? null,
        group: record.group ?? null,
        weight: typeof record.weight === 'number' ? record.weight : null,
        record,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id));

    if (!source || content === null) {
      return;
    }
    await transactionalDb
      .update(pageFiles)
      .set({ content, updatedAt: new Date() })
      .where(and(eq(pageFiles.pageId, id), eq(pageFiles.path, source.path)));
    // Hash exactly as publish does, so the next bulk publish compares like for like.
    const sourceHash = hashPathValues(
      files.map((file) => ({ path: file.path, value: file.path === source.path ? content : (file.content ?? '') }))
    );
    await transactionalDb
      .update(buildMetadata)
      .set({ sourceHash, updatedAt: new Date() })
      .where(and(eq(buildMetadata.entityKind, 'page'), eq(buildMetadata.entityId, id)));
  });

  return { data: withMetadata(record, metadata), build: await resolveBuildMeta(db, 'page', id) };
};

/**
 * Apply an allowlisted metadata update: allowlisted top-level fields are written to both the
 * normalized record and their promoted columns, and review metadata is merged over the existing
 * value. Artifacts and build state are deliberately untouched. Returns `null` when absent.
 */
export const updateEntityMetadata = async (
  db: RegistryDatabase,
  kind: ManagedEntityKind,
  id: string,
  write: ValidatedMetadataWrite
): Promise<EntityReadResult | null> => {
  if (kind === 'page') {
    return updatePageMetadata(db, id, write);
  }
  const spec = ENTITY[kind];
  const rows = await db
    .select({ record: spec.table.record, metadata: spec.table.metadata })
    .from(spec.table)
    .where(eq(spec.table.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }

  const record = { ...(row.record as Record<string, unknown>) };
  const { fields } = write;
  const promoted: Record<string, unknown> = { updatedAt: new Date() };

  if ('title' in fields) {
    record.title = fields.title;
    promoted.title = fields.title;
  }
  if ('description' in fields) {
    record.description = fields.description;
    promoted.description = fields.description;
  }
  if ('group' in fields) {
    record.group = fields.group;
    promoted.group = fields.group;
  }
  if ('tags' in fields) {
    record.tags = fields.tags;
    promoted.tags = fields.tags;
  }
  if (kind === 'component' && 'categories' in fields) {
    record.categories = fields.categories;
    promoted.categories = fields.categories;
  }

  const metadata = mergeReviewMetadata(row.metadata, write.metadata);
  promoted.record = record;
  promoted.metadata = metadata;

  await db
    .update(spec.table)
    .set(promoted as any)
    .where(eq(spec.table.id, id));
  return { data: withMetadata(record, metadata), build: await resolveBuildMeta(db, kind, id) };
};

/**
 * Delete an entity and only the artifacts it owns. Cascade removes its text-file records; shared
 * artifacts owned by `asset` are preserved. Returns `false` when the entity does not exist.
 */
export const deleteEntity = async (db: RegistryDatabase, kind: ManagedEntityKind, id: string): Promise<boolean> => {
  return db.transaction(async (tx) => {
    const transactionalDb = tx as unknown as RegistryDatabase;
    const spec = ENTITY[kind];
    if (!(await entityExists(transactionalDb, kind, id))) {
      return false;
    }
    await transactionalDb.delete(docsArtifacts).where(and(eq(docsArtifacts.entityKind, kind), eq(docsArtifacts.entityId, id)));
    if (kind !== 'page') {
      await transactionalDb.delete(docsArtifacts).where(and(eq(docsArtifacts.ownerKind, kind), eq(docsArtifacts.ownerId, id)));
    }
    await transactionalDb.delete(buildMetadata).where(and(eq(buildMetadata.entityKind, kind), eq(buildMetadata.entityId, id)));
    await transactionalDb.delete(spec.table).where(eq(spec.table.id, id));
    return true;
  });
};

/** List an entity's text-file records (inline content only). */
export const listEntityFiles = async (db: RegistryDatabase, kind: ManagedEntityKind, id: string): Promise<ValidatedFile[]> => {
  const spec = ENTITY[kind];
  const rows = await db
    .select({
      path: spec.filesTable.path,
      kind: spec.filesTable.kind,
      content: spec.filesTable.content,
      contentType: spec.filesTable.contentType,
    })
    .from(spec.filesTable)
    .where(eq(spec.fileFkColumn, id));
  return rows
    .filter((row) => row.content != null)
    .map((row) => ({ path: row.path, kind: row.kind, content: row.content as string, contentType: row.contentType }));
};

/** Read one text-file record by path, or `null` when absent (or stored without inline content). */
export const getEntityFile = async (
  db: RegistryDatabase,
  kind: ManagedEntityKind,
  id: string,
  filePath: string
): Promise<ValidatedFile | null> => {
  const spec = ENTITY[kind];
  const rows = await db
    .select({
      path: spec.filesTable.path,
      kind: spec.filesTable.kind,
      content: spec.filesTable.content,
      contentType: spec.filesTable.contentType,
    })
    .from(spec.filesTable)
    .where(and(eq(spec.fileFkColumn, id), eq(spec.filesTable.path, filePath)))
    .limit(1);
  const row = rows[0];
  if (!row || row.content == null) {
    return null;
  }
  return { path: row.path, kind: row.kind, content: row.content, contentType: row.contentType };
};

/** Insert or update a text-file record for an entity. */
export const upsertEntityFile = async (
  db: RegistryDatabase,
  kind: ManagedEntityKind,
  id: string,
  file: ValidatedFile
): Promise<ValidatedFile> => {
  const spec = ENTITY[kind];
  await db
    .insert(spec.filesTable)
    .values({
      [spec.fileFkName]: id,
      path: file.path,
      kind: file.kind,
      content: file.content,
      contentType: file.contentType,
    } as any)
    .onConflictDoUpdate({
      target: [spec.fileFkColumn, spec.filesTable.path],
      set: { kind: file.kind, content: file.content, contentType: file.contentType, updatedAt: new Date() },
    });
  return file;
};

/** Delete a text-file record by path. Returns `false` when no such file exists. */
export const deleteEntityFile = async (db: RegistryDatabase, kind: ManagedEntityKind, id: string, filePath: string): Promise<boolean> => {
  const spec = ENTITY[kind];
  const rows = await db
    .select({ path: spec.filesTable.path })
    .from(spec.filesTable)
    .where(and(eq(spec.fileFkColumn, id), eq(spec.filesTable.path, filePath)))
    .limit(1);
  if (!rows[0]) {
    return false;
  }
  await db.delete(spec.filesTable).where(and(eq(spec.fileFkColumn, id), eq(spec.filesTable.path, filePath)));
  return true;
};
