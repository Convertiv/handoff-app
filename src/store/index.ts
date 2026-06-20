/**
 * Normalized store abstraction (technical design §3).
 *
 * The workspace (filesystem) store ships now; the registry (database) store implements the same
 * interface in a later issue. Consumers depend only on the interfaces exported here so they remain
 * storage-agnostic.
 */

export type {
  Awaitable,
  ComponentStore,
  HandoffStore,
  PatternStore,
  SourceReference,
  TextFileKind,
  TextFileResource,
} from './types';

export {
  FilesystemComponentStore,
  FilesystemPatternStore,
  type FilesystemStoreContext,
} from './filesystem';

export { getRelatedSourceFilesForRecord, isWorkspaceOnlyFile, sourceContentTypeForPath } from './source-files';

import { FilesystemComponentStore, FilesystemPatternStore, type FilesystemStoreContext } from './filesystem';
import type { HandoffStore } from './types';

/**
 * Build the filesystem-backed store pair for a runtime context (a `Handoff` instance satisfies
 * {@link FilesystemStoreContext}).
 */
export const createFilesystemStore = (context: FilesystemStoreContext): HandoffStore => ({
  components: new FilesystemComponentStore(context),
  patterns: new FilesystemPatternStore(context),
});
