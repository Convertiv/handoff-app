/**
 * Transfer payload contract shared by the connected-workspace publish client and the registry-side
 * ingestion endpoint.
 *
 * Publish is the only path allowed to set render/build-defining fields, source files, rendered
 * artifacts, and build metadata. This module is the single shared description of that wire shape so
 * the CLI (which builds and uploads the package) and the registry API (which validates and ingests
 * it) never drift. Types only — no runtime behavior.
 */

import type { ArtifactKind, ArtifactOwnerKind, ArtifactReference } from '../artifacts/types';
import type { RegistryTextFileKind } from './db/schema';

/** Entity kinds that can be transferred (published/checked out). */
export type TransferEntityKind = 'component' | 'pattern';

/**
 * A registry-safe source file in a transfer package. Declarations are workspace-only (synthesized on
 * checkout) and are never present here — `kind` excludes `declaration` by type.
 */
export interface TransferFile {
  /** Registry-safe relative path within the entity (e.g. `Badge.tsx`). */
  path: string;
  kind: RegistryTextFileKind;
  content: string;
  contentType: string;
}

/**
 * A rendered docs read-model artifact in a transfer package. Carries the structured ownership and
 * references the registry stores so it can validate, serve, and dedup the artifact without ever
 * parsing HTML.
 */
export interface TransferArtifact {
  /** Logical artifact path (e.g. `component/badge-primary.html`, `component/main.css`). */
  path: string;
  artifactKind: ArtifactKind;
  content: string;
  contentType: string;
  /** What the artifact belongs to — shared/global artifacts are `asset` with a `null` owner id. */
  ownerKind: ArtifactOwnerKind;
  ownerId: string | null;
  /** Structured references this artifact depends on (drives required-reference validation). */
  references?: ArtifactReference[];
  formatVersion?: string;
  hash?: string;
  size?: number;
}

/** Build/provenance metadata for the published entity. */
export interface TransferBuild {
  status: 'current' | 'stale' | 'missing' | 'error';
  builtAt?: string;
  builderVersion?: string;
  artifactHash?: string;
  sourceHash?: string;
  warnings?: string[];
  error?: string;
}

/**
 * The full publish package uploaded to `PUT /api/registry/transfer/{component|pattern}/:id`:
 * the normalized record, checkout-oriented source files (declarations excluded), the rendered
 * artifacts (including required shared/global artifacts), and build metadata.
 */
export interface TransferPackage {
  /** Normalized record (a `ComponentListObject`/`PatternListObject`), stored as the served record. */
  item: Record<string, unknown>;
  files: TransferFile[];
  artifacts: TransferArtifact[];
  build: TransferBuild;
}

/**
 * The checkout payload returned by `GET /api/registry/transfer/{component|pattern}/:id`:
 * the normalized record and its registry-safe source files. Declarations are workspace-only and are
 * never present — the consuming workspace synthesizes the declaration locally.
 */
export interface CheckoutPayload {
  kind: TransferEntityKind;
  /** Normalized record (a `ComponentListObject`/`PatternListObject`) the entity is reconstructed from. */
  item: Record<string, unknown>;
  files: TransferFile[];
}
