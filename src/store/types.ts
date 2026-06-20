/**
 * Normalized store abstraction for handoff-app v2.
 *
 * Both the workspace (filesystem) store and the future registry (database) store implement one
 * read contract, so the docs read API and other consumers are storage-agnostic (technical design
 * §3). Read methods are typed `Awaitable` so the filesystem implementation can stay synchronous
 * while a database implementation is async behind the same interface.
 *
 * This module is types-only and provider-agnostic.
 */

import type { ComponentListObject, PatternListObject } from '../transformers/preview/types';

/** A value that may be returned directly or as a promise. */
export type Awaitable<T> = T | Promise<T>;

/**
 * Kind of a text source file tracked by the store. Mirrors the registry text-file model
 * (technical design §3/§8). `declaration` is **workspace-only** — registry stores never return it
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

/** Convenience pairing of the two stores backing one runtime. */
export interface HandoffStore {
  components: ComponentStore;
  patterns: PatternStore;
}
