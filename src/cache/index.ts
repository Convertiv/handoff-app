// File state utilities
export { computeDirectoryState, computeFileState, directoryStatesMatch, statesMatch, type FileState } from './file-state';

// Content hash utilities
export { computeComponentContentHash, type ComponentContentHash } from './content-hash';

// Build cache utilities
export {
  checkOutputExists,
  computeComponentFileStates,
  computeGlobalDepsState,
  createEmptyCache,
  getCachePath,
  hasComponentChanged,
  haveGlobalDepsChanged,
  loadBuildCache,
  pruneRemovedComponents,
  saveBuildCache,
  updateComponentCacheEntry,
  type BuildCache,
  type ComponentCacheEntry,
  type GlobalDepsState,
} from './build-cache';
