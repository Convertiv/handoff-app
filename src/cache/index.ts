// File state utilities
export { computeDirectoryState, computeFileState, directoryStatesMatch, statesMatch, type FileState } from './file-state';

// Build cache utilities
export {
  checkOutputExists,
  collectBuildInputFiles,
  collectComponentSources,
  computeBuildInputStates,
  computeComponentFileStates,
  computeGlobalDepsState,
  createEmptyCache,
  getCachePath,
  getComponentFilePaths,
  getGlobalEntryDirectories,
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

// Source files of each component, for the watcher and publish
export {
  getComponentSourcesPath,
  readComponentSources,
  recordComponentSources,
  type BuiltComponentSources,
  type ComponentSources,
} from './component-sources';
