/**
 * Normalized store abstraction.
 *
 * Both the workspace (filesystem) store and the future registry (database) store implement one
 * read contract, so the docs read API and other consumers are storage-agnostic.
 * Read methods are typed `Awaitable` so the filesystem implementation can stay synchronous
 * while a database implementation is async behind the same interface.
 *
 * This module is types-only and provider-agnostic.
 */

import type { TokenSetKind } from '../registry/tokens/sets';
import type { ComponentListObject, PageListObject, PatternListObject } from '../transformers/preview/types';

/** A value that may be returned directly or as a promise. */
export type Awaitable<T> = T | Promise<T>;

/**
 * Kind of a text source file tracked by the store. Mirrors the registry text-file model.
 * `declaration` is **workspace-only** — registry stores never return it
 * and declarations are synthesized on checkout.
 */
export type TextFileKind =
  | 'declaration'
  | 'component'
  | 'template'
  | 'style'
  | 'script'
  | 'story'
  | 'docs'
  | 'markdown'
  | 'schema'
  | 'other';

/**
 * A normalized text source file belonging to a component or pattern. Used for checkout,
 * inspection, and publish — never to rebuild previews during docs serving.
 */
export interface TextFileResource {
  /** Registry-safe relative path of the file within the entity (e.g. `Badge.tsx`). */
  path: string;
  /** Absolute filesystem path the content was read from (workspace store only). */
  absolutePath: string;
  /** Classified file kind. */
  kind: TextFileKind;
  /** File content. */
  content: string;
  /** Content type to serve/transfer the file with. */
  contentType: string;
}

/**
 * A reference to a source file resolvable by a store. For the filesystem store this is an
 * absolute path; the contract keeps it opaque so a database store can use its own reference form.
 */
export interface SourceReference {
  /** Absolute filesystem path (workspace store). */
  absolutePath: string;
}

/**
 * Read contract implemented by every component store backing. Consumers depend only on this so
 * they never need to know whether the filesystem or a database is active.
 */
export interface ComponentStore {
  /** All normalized component records, identical in shape to today's runtime records. */
  list(): Awaitable<ComponentListObject[]>;
  /** A single normalized component record by stable id, or `null` when absent. */
  get(id: string): Awaitable<ComponentListObject | null>;
  /** Read a source file by reference, or `null` when it cannot be resolved. */
  getSource(ref: SourceReference): Awaitable<TextFileResource | null>;
  /**
   * The entity's declaration plus every `entries`-referenced source file, for checkout/publish.
   * Returns an empty array when the entity is unknown.
   */
  getRelatedSourceFiles(id: string): Awaitable<TextFileResource[]>;
}

/**
 * Read contract implemented by every pattern store backing. Same shape as {@link ComponentStore}
 * over pattern records.
 */
export interface PatternStore {
  /** All normalized pattern records, identical in shape to today's runtime records. */
  list(): Awaitable<PatternListObject[]>;
  /** A single normalized pattern record by stable id, or `null` when absent. */
  get(id: string): Awaitable<PatternListObject | null>;
  /** Read a source file by reference, or `null` when it cannot be resolved. */
  getSource(ref: SourceReference): Awaitable<TextFileResource | null>;
  /**
   * The pattern's declaration plus every `entries`-referenced source file, for checkout/publish.
   * Returns an empty array when the pattern is unknown.
   */
  getRelatedSourceFiles(id: string): Awaitable<TextFileResource[]>;
}

/**
 * Read contract implemented by every page store backing. Same shape as {@link PatternStore} over
 * page records. A page's single related source file is its verbatim `.md` (kind `markdown`).
 */
export interface PageStore {
  /** All normalized page records. */
  list(): Awaitable<PageListObject[]>;
  /** A single normalized page record by stable id, or `null` when absent. */
  get(id: string): Awaitable<PageListObject | null>;
  /** Read a source file by reference, or `null` when it cannot be resolved. */
  getSource(ref: SourceReference): Awaitable<TextFileResource | null>;
  /** The page's verbatim `.md` source file, for checkout/publish. Empty when the page is unknown. */
  getRelatedSourceFiles(id: string): Awaitable<TextFileResource[]>;
}

/**
 * A logical token set as the store exposes it: its stable id, kind, and the exact extracted token
 * slice (a `record` of `IColorObject[]`/…/`IFileComponentObject`). Consumers read the whole set and
 * group/sort/look up in memory, so there is no individual-token accessor.
 */
export interface TokenSetRecord {
  id: string;
  kind: TokenSetKind;
  record: unknown;
}

/** A generated token artifact (CSS/SCSS/Style Dictionary/types/custom output) as the store returns it. */
export interface TokenArtifactResource {
  /** Registry-safe relative output path under the tokens dir (e.g. `css/colors.css`). */
  path: string;
  /** Logical format label (`css`|`scss`|`types`|`styleDictionary`|custom). */
  format: string;
  content: string;
  contentType: string;
}

/**
 * Read contract implemented by every token store backing. The filesystem backing derives sets from
 * the local `tokens.json` + generated files; the registry backing reads the `token_sets` /
 * `token_artifacts` tables. Consumers depend only on this so token behavior is consistent across
 * modes even though the storage differs.
 */
export interface TokenStore {
  /** All logical token sets (three foundation sets + one per component). */
  listSets(): Awaitable<TokenSetRecord[]>;
  /** A single set by stable id, or `null` when absent. */
  getSet(id: string): Awaitable<TokenSetRecord | null>;
  /** Every generated artifact owned by a set. Empty when the set is unknown or has no output. */
  getArtifacts(id: string): Awaitable<TokenArtifactResource[]>;
  /** One generated artifact for a set by logical format, or `null` when absent. */
  getArtifact(id: string, format: string): Awaitable<TokenArtifactResource | null>;
}

/**
 * Lightweight metadata for one published asset. Collection/list reads return only this shape - never
 * the binary body - so large collections do not produce oversized responses.
 */
export interface AssetMetadata {
  /** Collection the asset belongs to (`icons`|`logos`|`fonts`). */
  collection: string;
  /** Registry-safe logical path within the collection (e.g. `assets/icons/add.svg`, `icons.zip`). */
  path: string;
  /** Human-facing asset name. */
  name: string;
  /** Content type to serve the asset with. */
  contentType: string;
  /** Byte length. */
  size: number;
  /** SHA-256 of the bytes (hex) - content identity + ETag. */
  contentHash: string;
  /** Free-form asset metadata carried from extraction (icon index, description, …). */
  metadata?: Record<string, unknown> | null;
}

/**
 * An asset's resolved content: inline bytes (filesystem store, or a DB-backed blob), or a redirect
 * URL when an object-storage provider serves the content directly.
 */
export interface AssetContentResource extends AssetMetadata {
  /** Inline bytes, when the content is served from the filesystem or an inline DB blob. */
  body?: Buffer;
  /** Signed/public provider URL to redirect to, when an object-storage provider serves the content. */
  redirectUrl?: string;
}

/**
 * Read contract implemented by every asset store backing. The filesystem backing derives collections
 * from the generated `public/api` tree + archives; the registry backing reads the `assets` /
 * `asset_collections` tables and resolves content through the configured storage provider. List
 * methods return metadata only; content is fetched one asset at a time.
 */
export interface AssetStore {
  /** All collections that have any published assets. */
  listCollections(): Awaitable<string[]>;
  /** Lightweight metadata for every asset in a collection (no bodies). Empty when unknown. */
  listAssets(collection: string): Awaitable<AssetMetadata[]>;
  /** Metadata for one asset by collection + logical path, or `null` when absent. */
  getAsset(collection: string, path: string): Awaitable<AssetMetadata | null>;
  /** One asset's resolved content (bytes or redirect), or `null` when absent. */
  getAssetContent(collection: string, path: string): Awaitable<AssetContentResource | null>;
}

/** Convenience pairing of the stores backing one runtime. */
export interface HandoffStore {
  components: ComponentStore;
  patterns: PatternStore;
  pages: PageStore;
  tokens: TokenStore;
  assets: AssetStore;
}
