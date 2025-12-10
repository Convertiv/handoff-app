import Handoff from '../index';
import { FileState } from './file-state';
/**
 * Cache entry for a single component
 */
export interface ComponentCacheEntry {
    /** File states for all source files of this component */
    files: Record<string, FileState>;
    /** States for template directory files (if templates is a directory) */
    templateDirFiles?: Record<string, FileState>;
    /** Timestamp when this component was last built */
    buildTimestamp: number;
}
/**
 * State of global dependencies that affect all components
 */
export interface GlobalDepsState {
    /** tokens.json file state */
    tokens?: FileState;
    /** shared.scss or shared.css file state */
    sharedStyles?: FileState;
    /** Global SCSS entry file state */
    globalScss?: FileState;
    /** Global JS entry file state */
    globalJs?: FileState;
}
/**
 * Complete build cache structure
 */
export interface BuildCache {
    /** Cache format version for invalidation on structure changes */
    version: string;
    /** State of global dependencies at last build */
    globalDeps: GlobalDepsState;
    /** Per-component cache entries: componentId -> entry */
    components: Record<string, ComponentCacheEntry>;
}
/**
 * Gets the path to the build cache file
 */
export declare function getCachePath(handoff: Handoff): string;
/**
 * Loads the build cache from disk
 * @returns The cached data or null if cache doesn't exist or is invalid
 */
export declare function loadBuildCache(handoff: Handoff): Promise<BuildCache | null>;
/**
 * Saves the build cache to disk
 * Uses atomic write (temp file + rename) to prevent corruption
 */
export declare function saveBuildCache(handoff: Handoff, cache: BuildCache): Promise<void>;
/**
 * Computes the current state of global dependencies
 */
export declare function computeGlobalDepsState(handoff: Handoff): Promise<GlobalDepsState>;
/**
 * Checks if global dependencies have changed
 */
export declare function haveGlobalDepsChanged(cached: GlobalDepsState | null | undefined, current: GlobalDepsState): boolean;
/**
 * Gets all file paths that should be tracked for a component
 */
export declare function getComponentFilePaths(handoff: Handoff, componentId: string): {
    files: string[];
    templateDir?: string;
};
/**
 * Computes current file states for a component
 */
export declare function computeComponentFileStates(handoff: Handoff, componentId: string): Promise<{
    files: Record<string, FileState>;
    templateDirFiles?: Record<string, FileState>;
}>;
/**
 * Checks if a component needs to be rebuilt based on file states
 */
export declare function hasComponentChanged(cached: ComponentCacheEntry | null | undefined, current: {
    files: Record<string, FileState>;
    templateDirFiles?: Record<string, FileState>;
}): boolean;
/**
 * Checks if the component output files exist
 */
export declare function checkOutputExists(handoff: Handoff, componentId: string): Promise<boolean>;
/**
 * Creates an empty cache structure
 */
export declare function createEmptyCache(): BuildCache;
/**
 * Updates cache entry for a specific component
 */
export declare function updateComponentCacheEntry(cache: BuildCache, componentId: string, fileStates: {
    files: Record<string, FileState>;
    templateDirFiles?: Record<string, FileState>;
}): void;
/**
 * Removes components from cache that are no longer in runtime config
 */
export declare function pruneRemovedComponents(cache: BuildCache, currentComponentIds: string[]): void;
