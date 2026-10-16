/**
 * Transfer payload contract for asset collections, shared by the connected-workspace publish/checkout
 * client and the registry-side asset ingestion endpoints.
 *
 * Assets are their own transfer concern: a collection is a set of individually addressed binary files
 * whose bytes travel as content-addressed **blobs** (uploaded/downloaded one at a time so a large
 * collection never becomes one oversized request), while the collection **manifest** carries only
 * metadata. Types only, no behavior.
 */

import type { AssetCollection } from './sets';
import type { ArtifactBuildStatus } from '../../artifacts/types';
import type { TransferBuild } from '../transfer';

/** One asset's metadata in a collection manifest (never the binary body). */
export interface AssetManifestEntry {
  /** Registry-safe logical path within the collection. */
  path: string;
  /** Human-facing asset name. */
  name: string;
  contentType: string;
  size: number;
  /** SHA-256 of the bytes (hex), the blob identity this entry references. */
  contentHash: string;
  /** Free-form asset metadata carried from extraction. */
  metadata?: Record<string, unknown> | null;
}

/**
 * The collection publish package uploaded to `PUT /api/registry/transfer/assets/:collection` after
 * its blobs have been uploaded: the full manifest and build metadata keyed by `sourceHash`.
 */
export interface AssetCollectionTransferPackage {
  collection: AssetCollection;
  build: TransferBuild;
  assets: AssetManifestEntry[];
}

/** The checkout payload returned by `GET /api/registry/transfer/assets/:collection`. */
export interface AssetCollectionCheckoutPayload {
  collection: AssetCollection;
  assets: AssetManifestEntry[];
}

/** A lightweight collection summary (`GET /api/registry/transfer/assets`) driving skip-unchanged / bulk checkout. */
export interface AssetCollectionSummary {
  collection: AssetCollection;
  sourceHash: string | null;
  status: ArtifactBuildStatus | null;
}
