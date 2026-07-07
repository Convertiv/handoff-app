/**
 * Transfer payload contract for token sets, shared by the connected-workspace publish/checkout client
 * and the registry-side token ingestion endpoint.
 *
 * Tokens are their own transfer concern (a `record` slice + byte-for-byte generated artifacts, no
 * source files and no artifact reference graph), so they use this dedicated shape rather than the
 * component/pattern/page {@link import('../transfer').TransferPackage}. Types only — no behavior.
 */

import type { TransferBuild } from '../transfer';
import type { RegistryBuildStatus } from '../db/schema';
import type { TokenSetKind } from './sets';

/** A generated token artifact in a transfer package (CSS/SCSS/Style Dictionary/types/custom output). */
export interface TokenSetTransferArtifact {
  /** Registry-safe relative output path under the tokens dir (e.g. `css/colors.css`). */
  path: string;
  /** Logical format label (`css`|`scss`|`types`|`styleDictionary`|custom outDir). */
  format: string;
  content: string;
  contentType: string;
  hash?: string;
  size?: number;
}

/**
 * The full token-set publish package uploaded to `PUT /api/registry/transfer/tokens/:setId`: the
 * extracted record slice, the generated artifacts, and build/provenance metadata (keyed by
 * `sourceHash`).
 */
export interface TokenSetTransferPackage {
  id: string;
  kind: TokenSetKind;
  /** The exact extracted token slice (`IColorObject[]`/…/`IFileComponentObject`). */
  record: unknown;
  artifacts: TokenSetTransferArtifact[];
  build: TransferBuild;
}

/** The checkout payload returned by `GET /api/registry/transfer/tokens/:setId`. */
export interface TokenSetCheckoutPayload {
  id: string;
  kind: TokenSetKind;
  record: unknown;
  artifacts: TokenSetTransferArtifact[];
}

/** A lightweight token-set summary (`GET /api/registry/transfer/tokens`) driving skip-unchanged + bulk checkout. */
export interface TokenSetSummary {
  id: string;
  kind: TokenSetKind;
  sourceHash: string | null;
  status: RegistryBuildStatus | null;
}
