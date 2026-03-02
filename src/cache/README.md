# Cache Module

Incremental build cache for component previews. Tracks file states to skip rebuilding unchanged components.

## Files

| File | Purpose |
|------|---------|
| `file-state.ts` | `computeFileState()`, `computeDirectoryState()`, `statesMatch()` — file-level change detection |
| `build-cache.ts` | `loadBuildCache()`, `saveBuildCache()`, `hasComponentChanged()` — component-level cache management |
| `index.ts` | Barrel re-exports |
