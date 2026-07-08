/**
 * Normalized store abstraction.
 *
 * The workspace (filesystem) store is exported here. The registry (database) store implements the
 * same interface in `./registry`, but is intentionally **not** re-exported from this barrel so the
 * Drizzle/Postgres dependencies it pulls in stay out of the workspace/static path — registry
 * consumers import `@handoff/store/registry` directly (and lazily). Consumers depend only on the
 * interfaces exported here so they remain storage-agnostic.
 */

export type {
  AssetContentResource,
  AssetMetadata,
  AssetStore,
  Awaitable,
  ComponentStore,
  HandoffStore,
  PageStore,
  PatternStore,
  SourceReference,
  TextFileKind,
  TextFileResource,
  TokenArtifactResource,
  TokenSetRecord,
  TokenStore,
} from './types';

export {
  FilesystemAssetStore,
  FilesystemComponentStore,
  FilesystemPageStore,
  FilesystemPatternStore,
  FilesystemTokenStore,
  type FilesystemStoreContext,
} from './filesystem';

export { getRelatedSourceFilesForRecord, isWorkspaceOnlyFile, sourceContentTypeForPath } from './source-files';

import {
  FilesystemAssetStore,
  FilesystemComponentStore,
  FilesystemPageStore,
  FilesystemPatternStore,
  FilesystemTokenStore,
  type FilesystemStoreContext,
} from './filesystem';
import type { HandoffStore } from './types';

/**
 * Build the filesystem-backed store set for a runtime context (a `Handoff` instance satisfies
 * {@link FilesystemStoreContext}).
 */
export const createFilesystemStore = (context: FilesystemStoreContext): HandoffStore => ({
  components: new FilesystemComponentStore(context),
  patterns: new FilesystemPatternStore(context),
  pages: new FilesystemPageStore(context),
  tokens: new FilesystemTokenStore(context),
  assets: new FilesystemAssetStore(context),
});
