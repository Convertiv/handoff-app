// File state utilities
export { computeDirectoryState, computeFileState, directoryStatesMatch, statesMatch, type FileState } from './file-state';

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
