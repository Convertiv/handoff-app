// File state utilities
export { computeDirectoryState, computeFileState, directoryStatesMatch, statesMatch, type FileState } from './file-state';

// Build cache utilities
export {
  checkOutputExists,
  computeBuildInputStates,
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

// Build input collection
export { createBuildInputs, type BuildInputs } from './build-inputs';
