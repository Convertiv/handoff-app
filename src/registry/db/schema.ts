/**
 * Drizzle ORM schema for handoff-app v2 registry storage (technical design §8).
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
 * - Artifact and build-metadata columns mirror the structured artifact model from issue #2
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
import { check, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import type { ArtifactKind, ArtifactOwnerKind, ArtifactReference } from '../../artifacts/types';
import type { TextFileKind } from '../../store/types';
import type { ComponentListObject, PatternComponentEntry, PatternListObject } from '../../transformers/preview/types';

/**
 * Text file kinds persisted by the registry. Declarations are a workspace-only concern
 * (synthesized on checkout) and are never stored as registry text file records.
 */
export type RegistryTextFileKind = Exclude<TextFileKind, 'declaration'>;

/** Entity a docs read-model artifact is associated with. */
export type DocsArtifactEntityKind = 'component' | 'pattern' | 'summary' | 'asset';

/** Entity a build-metadata record is associated with. */
export type BuildMetadataEntityKind = 'component' | 'pattern' | 'asset' | 'summary';

/** Build status mirrored from {@link import('../../artifacts/types').ArtifactBuildStatus}. */
export type RegistryBuildStatus = 'current' | 'stale' | 'missing' | 'error';

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
 * Docs read-model artifacts. Path-keyed so shared/global artifacts (`component/main.css`,
 * `component/main.js`, `component/shared.css`) are upserted by stable logical path. Mirrors the
 * `ArtifactDescriptor` field set from issue #2.
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
 * Build/artifact metadata per entity. Mirrors the `ArtifactBuildMetadata` field set from issue #2.
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

/** All registry tables, for typed Drizzle clients and migration tooling. */
export const registrySchema = {
  components,
  componentFiles,
  patterns,
  patternFiles,
  docsArtifacts,
  buildMetadata,
};
