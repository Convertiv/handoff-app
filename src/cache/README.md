# Cache Module

Incremental build cache for component previews. Tracks file states to skip rebuilding unchanged components.

Every full component build uses the cache (`start`, `build`, `build:components` without an id, and bulk `publish`), unless `--force` is set. The cache file is `<workingPath>/.handoff/.cache/build-cache.json`. A component entry holds its declared files and every file that its last build read: Rollup watch files from the Vite builds (Sass partials included) and the esbuild graph of each script entry. The lockfile state in the global dependencies covers the files under `node_modules`.

## Files

| File | Purpose |
|------|---------|
| `file-state.ts` | `computeFileState()`, `computeDirectoryState()`, `statesMatch()`, `directoryStatesMatch()` — file-level change detection |
| `build-cache.ts` | `loadBuildCache()`, `saveBuildCache()`, `hasComponentChanged()`, `computeGlobalDepsState()`, `haveGlobalDepsChanged()`, `computeComponentFileStates()`, `computeBuildInputStates()` — component-level and global dependency cache management |
| `build-inputs.ts` | `createBuildInputs()`, `withBuildInputs()` — collects the files that the Vite builds of a component read |
| `index.ts` | Barrel re-exports |
