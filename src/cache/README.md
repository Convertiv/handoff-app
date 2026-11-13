# Cache Module

Incremental build cache for component previews. Tracks file states to skip rebuilding unchanged components.

Every full component build uses the cache (`start`, `build`, `build:components` without an id, and bulk `publish`), unless `--force` is set. The cache file is `<workingPath>/.handoff/.cache/build-cache.json`. A component entry holds its declared files and every file that its last build read: Rollup watch files from the Vite builds (Sass partials included) and the esbuild graph of each script entry. The lockfile state in the global dependencies covers the files under `node_modules`.

`component-sources.json`, in the same directory, lists the source files of each component: its declared files and every file that its last build read, except declarations and `package.json`. `start` watches these files, and `publish` uploads the text files inside the item directory. A renderer whose build reads a file outside the import graph, such as an Angular `templateUrl`, calls `this.addWatchFile()` in its Vite plugin, so the file reaches this record and the build cache.

The build cache does not serve these consumers, for three reasons:

- A failed build drops its cache entry, so that the next run builds the component again. The sources record keeps the last known list, so `start` still watches the file that broke the build.
- Only full cached builds write the cache. Every component build writes the sources record, including `--force`, `publish <id>`, and the watcher's targeted rebuilds.
- The docs app reads the sources record through the store, and the cache module imports the build.

A build that ran only some segments adds its files to the recorded list instead of replacing it. A full cached build rebuilds a component that has no recorded sources. Neither list holds files under `node_modules`, `public/api`, or `.handoff`.

## Files

| File | Purpose |
|------|---------|
| `file-state.ts` | `computeFileState()`, `computeDirectoryState()`, `statesMatch()`, `directoryStatesMatch()` — file-level change detection |
| `build-cache.ts` | `loadBuildCache()`, `saveBuildCache()`, `hasComponentChanged()`, `computeGlobalDepsState()`, `haveGlobalDepsChanged()`, `computeComponentFileStates()`, `collectBuildInputFiles()`, `computeBuildInputStates()`, `getGlobalEntryDirectories()`, `collectComponentSources()` — component-level and global dependency cache management |
| `component-sources.ts` | `readComponentSources()`, `recordComponentSources()` — the source files of each component, for the watcher and publish. No build dependencies, because the docs app reads it through the store |
| `build-inputs.ts` | `createBuildInputs()`, `withBuildInputs()` — collects the files that the Vite builds of a component read |
| `index.ts` | Barrel re-exports |
