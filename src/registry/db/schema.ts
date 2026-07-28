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
import { check, customType, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
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

/** Registry account role. Administrators may issue write-scoped credentials. */
export type RegistryUserRole = 'admin' | 'member';

/** Registry account lifecycle. Invited and deactivated accounts cannot authenticate. */
export type RegistryUserStatus = 'invited' | 'active' | 'deactivated';

/** One-time account action represented by a hashed secret. */
export type RegistryAuthActionPurpose = 'invite' | 'password_reset';

/** Capability granted to a registry access token. */
export type RegistryAccessScope = 'registry:read' | 'registry:write';

/** State machine for an RFC 8628-style CLI device authorization. */
export type RegistryDeviceAuthorizationStatus = 'pending' | 'approved' | 'denied' | 'consumed';

/** Public endpoint family protected by a database-backed throttling counter. */
export type RegistryRateLimitBucket = 'login' | 'password_reset' | 'device';

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

/**
 * Registry users. Browser sessions carry the id and auth version, while protected requests re-read
 * this row so role/status changes take effect without waiting for a cookie to expire.
 */
export const registryUsers = pgTable(
  'registry_users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    name: text('name'),
    image: text('image'),
    role: text('role').$type<RegistryUserRole>().notNull().default('member'),
    status: text('status').$type<RegistryUserStatus>().notNull().default('invited'),
    passwordHash: text('password_hash'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    authVersion: integer('auth_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('registry_users_normalized_email_idx').on(sql`lower(btrim(${table.email}))`),
    index('registry_users_status_role_idx').on(table.status, table.role),
    check('registry_users_email_normalized', sql`${table.email} = lower(btrim(${table.email}))`),
    check('registry_users_role_valid', sql`${table.role} in ('admin', 'member')`),
    check('registry_users_status_valid', sql`${table.status} in ('invited', 'active', 'deactivated')`),
    check('registry_users_auth_version_positive', sql`${table.authVersion} > 0`),
  ]
);

/**
 * Permanent one-row installation marker. There is deliberately no reset path: deleting or
 * deactivating users must never reopen the public first-visitor installer.
 */
export const registryInstallations = pgTable(
  'registry_installations',
  {
    id: text('id').primaryKey().default('default'),
    status: text('status').notNull().default('installed'),
    schemaVersion: integer('schema_version').notNull(),
    initialAdminUserId: text('initial_admin_user_id')
      .notNull()
      .references(() => registryUsers.id, { onDelete: 'restrict' }),
    installedAt: timestamp('installed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('registry_installations_singleton', sql`${table.id} = 'default'`),
    check('registry_installations_status_valid', sql`${table.status} = 'installed'`),
    check('registry_installations_schema_version_positive', sql`${table.schemaVersion} > 0`),
  ]
);

/** Hash-only invitation and password-reset secrets. */
export const registryAuthActionTokens = pgTable(
  'registry_auth_action_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => registryUsers.id, { onDelete: 'cascade' }),
    purpose: text('purpose').$type<RegistryAuthActionPurpose>().notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('registry_auth_action_tokens_hash_idx').on(table.tokenHash),
    index('registry_auth_action_tokens_user_purpose_idx').on(table.userId, table.purpose),
    check('registry_auth_action_tokens_purpose_valid', sql`${table.purpose} in ('invite', 'password_reset')`),
  ]
);

/** Revocable, hash-only registry API credentials owned by one user. */
export const registryAccessTokens = pgTable(
  'registry_access_tokens',
  {
    /** Public lookup id embedded in the opaque token; not itself a credential. */
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => registryUsers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    secretHash: text('secret_hash').notNull(),
    scopes: jsonb('scopes').$type<RegistryAccessScope[]>().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('registry_access_tokens_user_idx').on(table.userId),
    index('registry_access_tokens_expires_idx').on(table.expiresAt),
    check('registry_access_tokens_name_not_blank', sql`length(btrim(${table.name})) > 0`),
    check('registry_access_tokens_scopes_array', sql`jsonb_typeof(${table.scopes}) = 'array'`),
  ]
);

/** Short-lived authorization used by `handoff-app login`. Plaintext device codes are never stored. */
export const registryDeviceAuthorizations = pgTable(
  'registry_device_authorizations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    deviceCodeHash: text('device_code_hash').notNull(),
    userCode: text('user_code').notNull(),
    status: text('status').$type<RegistryDeviceAuthorizationStatus>().notNull().default('pending'),
    userId: text('user_id').references(() => registryUsers.id, { onDelete: 'set null' }),
    scopes: jsonb('scopes').$type<RegistryAccessScope[]>().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('registry_device_authorizations_device_hash_idx').on(table.deviceCodeHash),
    uniqueIndex('registry_device_authorizations_user_code_idx').on(table.userCode),
    index('registry_device_authorizations_expires_idx').on(table.expiresAt),
    check('registry_device_authorizations_status_valid', sql`${table.status} in ('pending', 'approved', 'denied', 'consumed')`),
    check('registry_device_authorizations_scopes_array', sql`jsonb_typeof(${table.scopes}) = 'array'`),
  ]
);

/**
 * Fixed-window throttling counters. Callers pass a hash of the identifying value so raw emails and
 * IP addresses are not retained.
 */
export const registryAuthRateLimits = pgTable(
  'registry_auth_rate_limits',
  {
    bucket: text('bucket').$type<RegistryRateLimitBucket>().notNull(),
    identifierHash: text('identifier_hash').notNull(),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.bucket, table.identifierHash, table.windowStartedAt] }),
    index('registry_auth_rate_limits_expires_idx').on(table.expiresAt),
    check('registry_auth_rate_limits_bucket_valid', sql`${table.bucket} in ('login', 'password_reset', 'device')`),
    check('registry_auth_rate_limits_attempts_positive', sql`${table.attempts} > 0`),
  ]
);

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
  registryUsers,
  registryInstallations,
  registryAuthActionTokens,
  registryAccessTokens,
  registryDeviceAuthorizations,
  registryAuthRateLimits,
};
