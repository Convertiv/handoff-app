/**
 * Drizzle ORM schema for registry storage.
 *
 * The registry is database-backed (PostgreSQL, including PG-compatible managed services such as
 * Neon/Vercel). This schema declares the six record groups the registry persists:
 *
 * - `components` / `component_files`
 * - `patterns` / `pattern_files`
 * - `docs_artifacts` (docs read-model artifacts)
 * - `build_metadata` (build/artifact metadata)
 *
 * Schema notes:
 * - Artifact and build-metadata columns mirror the structured artifact model
 *   (`ArtifactDescriptor`, `ArtifactBuildMetadata`, `ArtifactReference`) so the database can
 *   validate, serve, and debug an artifact without ever parsing HTML.
 * - Metadata-only records are supported: a component/pattern row may exist with no
 *   `docs_artifacts` rows and a `build_metadata` row reporting `status: 'missing'`.
 * - Text file records (`component_files` / `pattern_files`) cover checkout/inspection/management
 *   only and **exclude declaration files** — a CHECK constraint rejects `kind = 'declaration'`,
 *   so declarations have no representation in registry text file records.
 * - `content` and `storage_ref` are both nullable so the model leaves room for future object
 *   storage of large/binary assets (a content-reference field) rather than assuming inline content.
 */

import { sql } from 'drizzle-orm';
import { check, customType, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import type { ArtifactBuildStatus, ArtifactKind, ArtifactOwnerKind, ArtifactReference } from '../../artifacts/types';
import type { RegistryTextFileKind } from '../../store/types';
import type { TokenSetKind } from '../tokens/sets';

/**
 * PostgreSQL `bytea` column. Drizzle pg-core has no built-in binary type, so declare it once here.
 * Reads/writes are Node `Buffer`s. The default asset storage adapter keeps small/ordinary asset
 * bytes inline in this column; larger assets are offloaded to an object-storage `storageRef` instead.
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/** Where an asset blob's bytes physically live: the default DB adapter, Vercel Blob, or a custom id. */
export type AssetStorageProvider = 'database' | 'vercel-blob' | (string & {});
import type { ComponentListObject, PageListObject, PatternComponentEntry, PatternListObject } from '../../transformers/preview/types';

/**
 * Entity a docs read-model artifact is associated with. `page` is included only for type-compat with
 * the generic management delete path (which filters `docs_artifacts.entityKind` by kind); pages emit
 * no artifacts, so no page-owned `docs_artifacts` rows ever exist.
 */
export type DocsArtifactEntityKind = 'component' | 'pattern' | 'page' | 'summary' | 'asset';

/** Entity a build-metadata record is associated with. A page publish writes one `build_metadata` row. */
export type BuildMetadataEntityKind = 'component' | 'pattern' | 'page' | 'asset' | 'summary';

/**
 * Registry-only review/catalog metadata maintained through the management API.
 *
 * These fields are review state, not render/build inputs — the management API's metadata allowlist
 * is the only writer, and updating them never touches `docs_artifacts` or `build_metadata`. Stored
 * in a dedicated column rather than the normalized `record` jsonb so the served record stays
 * identical in shape to what the filesystem store produces.
 */
export interface RegistryReviewMetadata {
  /** Free-form review status (e.g. `draft`, `in-review`, `approved`). */
  reviewStatus?: string;
  /** Reviewer notes. */
  notes?: string;
  /** Owner identifier (name, handle, or email). */
  owner?: string;
}

/** Build status mirrored from {@link import('../../artifacts/types').ArtifactBuildStatus}. */
export type RegistryBuildStatus = ArtifactBuildStatus;

/**
 * Components record group. `record` holds the full normalized {@link ComponentListObject} so the
 * registry serves the same record shape as the filesystem store; the promoted columns exist for
 * querying/sorting the catalog.
 */
export const components = pgTable(
  'components',
  {
    /** Stable component id (explicit `id`, else directory basename). Join key across stores. */
    id: text('id').primaryKey(),
    /** Logical docs path for the component. */
    path: text('path').notNull(),
    title: text('title'),
    description: text('description'),
    group: text('group'),
    type: text('type'),
    renderer: text('renderer'),
    tags: jsonb('tags').$type<string[]>(),
    categories: jsonb('categories').$type<string[]>(),
    /** Full normalized component record. */
    record: jsonb('record').$type<ComponentListObject>().notNull(),
    /** Registry-only review/catalog metadata (management-API allowlist; never a render input). */
    metadata: jsonb('metadata').$type<RegistryReviewMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('components_group_idx').on(table.group)]
);

/**
 * Component source files. Used for checkout/inspection/management only — never to rebuild
 * previews. Declaration files are rejected at the schema level.
 */
export const componentFiles = pgTable(
  'component_files',
  {
    componentId: text('component_id')
      .notNull()
      .references(() => components.id, { onDelete: 'cascade' }),
    /** Registry-safe relative path within the entity (e.g. `Badge.tsx`). */
    path: text('path').notNull(),
    kind: text('kind').$type<RegistryTextFileKind>().notNull(),
    /** Inline content; null when stored externally via `storageRef`. */
    content: text('content'),
    /** Reference to externally stored content (future object storage). */
    storageRef: text('storage_ref'),
    contentType: text('content_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.componentId, table.path] }),
    check('component_files_kind_not_declaration', sql`${table.kind} <> 'declaration'`),
  ]
);

/**
 * Patterns record group. `record` holds the full normalized {@link PatternListObject};
 * `components` promotes the pattern's component refs for querying.
 */
export const patterns = pgTable(
  'patterns',
  {
    /** Stable pattern id. Join key across stores. */
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
    description: text('description'),
    group: text('group'),
    tags: jsonb('tags').$type<string[]>(),
    /** Pattern component references. */
    components: jsonb('components').$type<PatternComponentEntry[]>(),
    /** Full normalized pattern record. */
    record: jsonb('record').$type<PatternListObject>().notNull(),
    /** Registry-only review/catalog metadata (management-API allowlist; never a render input). */
    metadata: jsonb('metadata').$type<RegistryReviewMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('patterns_group_idx').on(table.group)]
);

/**
 * Pattern source files. Same checkout/inspection/management role as {@link componentFiles};
 * declaration files are rejected at the schema level.
 */
export const patternFiles = pgTable(
  'pattern_files',
  {
    patternId: text('pattern_id')
      .notNull()
      .references(() => patterns.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    kind: text('kind').$type<RegistryTextFileKind>().notNull(),
    content: text('content'),
    storageRef: text('storage_ref'),
    contentType: text('content_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.patternId, table.path] }),
    check('pattern_files_kind_not_declaration', sql`${table.kind} <> 'declaration'`),
  ]
);

/**
 * Pages record group. `record` holds the full normalized {@link PageListObject} (frontmatter
 * metadata) so the registry serves the same record shape the filesystem store produces; promoted
 * columns exist for catalog querying/sorting. The markdown body travels as a `page_files` row, not in
 * the record — see {@link pageFiles}.
 */
export const pages = pgTable(
  'pages',
  {
    /** Stable page id (slug path, e.g. `guides/setup`). Join key across stores. */
    id: text('id').primaryKey(),
    /** Logical route the page is served at (e.g. `/guides/setup`). */
    path: text('path').notNull(),
    title: text('title'),
    description: text('description'),
    group: text('group'),
    /** Sort weight within the nav section. */
    weight: integer('weight'),
    /** Full normalized page record. */
    record: jsonb('record').$type<PageListObject>().notNull(),
    /** Registry-only review/catalog metadata (management-API allowlist; never a render input). */
    metadata: jsonb('metadata').$type<RegistryReviewMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('pages_group_idx').on(table.group)]
);

/**
 * Page source files. A page has a single verbatim `.md` (kind `markdown`) stored for byte-exact
 * checkout and for resolving the rendered body at request time. Declaration files are rejected at the
 * schema level (consistent with the other file tables, though pages never carry declarations).
 */
export const pageFiles = pgTable(
  'page_files',
  {
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    /** Registry-safe relative path within the entity (e.g. `guides/setup.md`). */
    path: text('path').notNull(),
    kind: text('kind').$type<RegistryTextFileKind>().notNull(),
    content: text('content'),
    storageRef: text('storage_ref'),
    contentType: text('content_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.pageId, table.path] }),
    check('page_files_kind_not_declaration', sql`${table.kind} <> 'declaration'`),
  ]
);

/**
 * Docs read-model artifacts. Path-keyed so shared/global artifacts (`component/main.css`,
 * `component/main.js`, `component/shared.css`) are upserted by stable logical path. Mirrors the
 * `ArtifactDescriptor` field set.
 */
export const docsArtifacts = pgTable(
  'docs_artifacts',
  {
    /** Logical artifact path (e.g. `component/badge-primary.html`). Stable serving key. */
    path: text('path').primaryKey(),
    entityKind: text('entity_kind').$type<DocsArtifactEntityKind>().notNull(),
    entityId: text('entity_id'),
    artifactKind: text('artifact_kind').$type<ArtifactKind>().notNull(),
    /** Inline content; null when stored externally via `storageRef`. */
    content: text('content'),
    /** Reference to externally stored content (future object storage). */
    storageRef: text('storage_ref'),
    contentType: text('content_type').notNull(),
    ownerKind: text('owner_kind').$type<ArtifactOwnerKind>(),
    ownerId: text('owner_id'),
    /** Structured required/optional references (drives validation/serving/dedup). */
    references: jsonb('references').$type<ArtifactReference[]>(),
    formatVersion: text('format_version'),
    buildId: text('build_id'),
    hash: text('hash'),
    size: integer('size'),
    /** Gzipped byte size diagnostic, when measured. */
    gzipSize: integer('gzip_size'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('docs_artifacts_entity_idx').on(table.entityKind, table.entityId),
    index('docs_artifacts_owner_idx').on(table.ownerKind, table.ownerId),
  ]
);

/**
 * Build/artifact metadata per entity. Mirrors the `ArtifactBuildMetadata` field set.
 * A successful publish records `status: 'current'` with `builtAt` + `builderVersion` +
 * `artifactHash`; metadata-only records report `status: 'missing'`.
 */
export const buildMetadata = pgTable(
  'build_metadata',
  {
    entityKind: text('entity_kind').$type<BuildMetadataEntityKind>().notNull(),
    entityId: text('entity_id').notNull(),
    status: text('status').$type<RegistryBuildStatus>().notNull(),
    builtAt: timestamp('built_at', { withTimezone: true }),
    builderVersion: text('builder_version'),
    artifactHash: text('artifact_hash'),
    sourceHash: text('source_hash'),
    warnings: jsonb('warnings').$type<string[]>(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.entityKind, table.entityId] })]
);

/**
 * Token sets record group. One row per logical token set (`foundation/colors`, `component/<id>`).
 * `record` holds the exact extracted token slice as JSONB so no token property is lost and new ones
 * flow through without a migration. Build/publish metadata (status/source_hash/built_at) lives on
 * this row — tokens are self-contained and do not use the shared `build_metadata` table.
 */
export const tokenSets = pgTable(
  'token_sets',
  {
    /** Stable logical set id (`foundation/colors` | `component/button`). Join key across stores. */
    id: text('id').primaryKey(),
    /** Set kind (`foundation` | `component`). */
    kind: text('kind').$type<TokenSetKind>().notNull(),
    /** Full extracted token slice (`IColorObject[]`/…/`IFileComponentObject`). */
    record: jsonb('record').notNull(),
    /** Deterministic content hash over the record + generated artifacts (drives skip-unchanged). */
    sourceHash: text('source_hash'),
    /** Build/publish status for the set. */
    status: text('status').$type<RegistryBuildStatus>(),
    builtAt: timestamp('built_at', { withTimezone: true }),
    builderVersion: text('builder_version'),
    /** Registry-only review/catalog metadata (parity with other entities; management-API only). */
    metadata: jsonb('metadata').$type<RegistryReviewMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('token_sets_kind_idx').on(table.kind)]
);

/**
 * Generated token artifacts owned by a token set (CSS/SCSS/Style Dictionary/types/custom transformer
 * output). Served byte-for-byte; the registry never re-runs transformers. Keyed by `(token_set_id,
 * path)` where `path` is the registry-safe output path relative to `getVariablesFilePath()`.
 */
export const tokenArtifacts = pgTable(
  'token_artifacts',
  {
    tokenSetId: text('token_set_id')
      .notNull()
      .references(() => tokenSets.id, { onDelete: 'cascade' }),
    /** Registry-safe relative output path (e.g. `css/colors.css`, `sd/button/button.tokens.json`). */
    path: text('path').notNull(),
    /** Logical format label (`css`|`scss`|`types`|`styleDictionary`|custom outDir). */
    format: text('format').notNull(),
    /** Inline content; null when stored externally via `storageRef`. */
    content: text('content'),
    /** Reference to externally stored content (future object storage). */
    storageRef: text('storage_ref'),
    contentType: text('content_type').notNull(),
    hash: text('hash'),
    size: integer('size'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.tokenSetId, table.path] })]
);

/**
 * Asset collections. Owns a collection (`icons`|`logos`|`fonts`) and its build/publish metadata
 * (mirrors {@link tokenSets}): `sourceHash` drives skip-unchanged, and the set of `assets` rows for a
 * collection is its current manifest. Publish replaces those rows atomically, so readers always see a
 * complete manifest.
 */
export const assetCollections = pgTable(
  'asset_collections',
  {
    /** Stable collection id (`icons`|`logos`|`fonts`). Join key across stores. */
    collection: text('collection').primaryKey(),
    /** Deterministic content hash over the collection's `(path, contentHash)` manifest (skip-unchanged). */
    sourceHash: text('source_hash'),
    /** Build/publish status for the collection. */
    status: text('status').$type<RegistryBuildStatus>(),
    builtAt: timestamp('built_at', { withTimezone: true }),
    builderVersion: text('builder_version'),
    /** Registry-only review/catalog metadata (parity with other entities; management-API only). */
    metadata: jsonb('metadata').$type<RegistryReviewMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

/**
 * Logical asset metadata - the collection manifest. One row per asset (icon/logo SVG, sprite,
 * sprite manifest, ZIP archive, font archive), keyed by `(collection, path)`. Binary content is not
 * stored here; `blobHash` references the content-addressed {@link assetBlobs} store, so identical
 * bytes across paths/collections dedupe to one blob.
 */
export const assets = pgTable(
  'assets',
  {
    collection: text('collection')
      .notNull()
      .references(() => assetCollections.collection, { onDelete: 'cascade' }),
    /** Registry-safe logical path within the collection (e.g. `assets/icons/add.svg`, `icons.zip`). */
    path: text('path').notNull(),
    /** Human-facing asset name. */
    name: text('name').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size'),
    /** SHA-256 of the asset bytes - the blob identity, and the ETag for content responses. */
    contentHash: text('content_hash').notNull(),
    /** Free-form asset metadata carried from extraction (icon index, description, …). */
    metadata: jsonb('metadata'),
    /** References {@link assetBlobs.hash}; equals `contentHash`. */
    blobHash: text('blob_hash')
      .notNull()
      .references(() => assetBlobs.hash),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.collection, table.path] })]
);

/**
 * Content-addressed binary blob store, shared across assets/collections (the `hash` is the blob
 * identity, so an unchanged file re-references the same row). Exactly one location is active per row:
 * inline `content` (bytea, default DB adapter) or an external `storageRef` resolved through the
 * recorded `storageProvider`. Both nullable so DB- and object-backed blobs coexist.
 */
export const assetBlobs = pgTable('asset_blobs', {
  /** SHA-256 of the blob bytes (hex). */
  hash: text('hash').primaryKey(),
  /** Which storage backed this blob when it was written (`database`|`vercel-blob`|custom id). */
  storageProvider: text('storage_provider').$type<AssetStorageProvider>().notNull(),
  /** Inline bytes; null when stored externally via `storageRef`. */
  content: bytea('content'),
  /** External object reference/key; null when stored inline in `content`. */
  storageRef: text('storage_ref'),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** All registry tables, for typed Drizzle clients and migration tooling. */
export const registrySchema = {
  components,
  componentFiles,
  patterns,
  patternFiles,
  pages,
  pageFiles,
  docsArtifacts,
  buildMetadata,
  tokenSets,
  tokenArtifacts,
  assetCollections,
  assets,
  assetBlobs,
};
