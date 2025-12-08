import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';
import { Logger } from '../utils/logger';
import { computeDirectoryState, computeFileState, directoryStatesMatch, FileState, statesMatch } from './file-state';

/** Current cache format version - bump when structure changes */
const CACHE_VERSION = '1.0.0';

/**
 * Cache entry for a single component version
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
  /** Per-component cache entries: componentId -> version -> entry */
  components: Record<string, Record<string, ComponentCacheEntry>>;
}

/**
 * Gets the path to the build cache file
 */
export function getCachePath(handoff: Handoff): string {
  return path.resolve(handoff.modulePath, '.handoff', handoff.getProjectId(), '.cache', 'build-cache.json');
}

/**
 * Loads the build cache from disk
 * @returns The cached data or null if cache doesn't exist or is invalid
 */
export async function loadBuildCache(handoff: Handoff): Promise<BuildCache | null> {
  const cachePath = getCachePath(handoff);

  try {
    if (!(await fs.pathExists(cachePath))) {
      Logger.debug('No existing build cache found');
      return null;
    }

    const data = await fs.readJson(cachePath);

    // Validate cache version
    if (data.version !== CACHE_VERSION) {
      Logger.debug(`Build cache version mismatch (${data.version} vs ${CACHE_VERSION}), invalidating`);
      return null;
    }

    return data as BuildCache;
  } catch (error) {
    Logger.debug('Failed to load build cache, will rebuild all components:', error);
    return null;
  }
}

/**
 * Saves the build cache to disk
 * Uses atomic write (temp file + rename) to prevent corruption
 */
export async function saveBuildCache(handoff: Handoff, cache: BuildCache): Promise<void> {
  const cachePath = getCachePath(handoff);
  const cacheDir = path.dirname(cachePath);
  const tempPath = `${cachePath}.tmp`;

  try {
    await fs.ensureDir(cacheDir);
    await fs.writeJson(tempPath, cache, { spaces: 2 });
    await fs.rename(tempPath, cachePath);
    Logger.debug('Build cache saved');
  } catch (error) {
    Logger.debug('Failed to save build cache:', error);
    // Clean up temp file if it exists
    try {
      await fs.remove(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Computes the current state of global dependencies
 */
export async function computeGlobalDepsState(handoff: Handoff): Promise<GlobalDepsState> {
  const result: GlobalDepsState = {};

  // tokens.json
  const tokensPath = handoff.getTokensFilePath();
  result.tokens = (await computeFileState(tokensPath)) ?? undefined;

  // shared.scss or shared.css
  const sharedScssPath = path.resolve(handoff.workingPath, 'integration/components/shared.scss');
  const sharedCssPath = path.resolve(handoff.workingPath, 'integration/components/shared.css');

  const sharedScssState = await computeFileState(sharedScssPath);
  const sharedCssState = await computeFileState(sharedCssPath);
  result.sharedStyles = sharedScssState ?? sharedCssState ?? undefined;

  // Global SCSS entry
  if (handoff.runtimeConfig?.entries?.scss) {
    result.globalScss = (await computeFileState(handoff.runtimeConfig.entries.scss)) ?? undefined;
  }

  // Global JS entry
  if (handoff.runtimeConfig?.entries?.js) {
    result.globalJs = (await computeFileState(handoff.runtimeConfig.entries.js)) ?? undefined;
  }

  return result;
}

/**
 * Checks if global dependencies have changed
 */
export function haveGlobalDepsChanged(cached: GlobalDepsState | null | undefined, current: GlobalDepsState): boolean {
  if (!cached) return true;

  // Check each global dependency
  if (!statesMatch(cached.tokens, current.tokens)) {
    Logger.debug('Global dependency changed: tokens.json');
    return true;
  }

  if (!statesMatch(cached.sharedStyles, current.sharedStyles)) {
    Logger.debug('Global dependency changed: shared styles');
    return true;
  }

  if (!statesMatch(cached.globalScss, current.globalScss)) {
    Logger.debug('Global dependency changed: global SCSS entry');
    return true;
  }

  if (!statesMatch(cached.globalJs, current.globalJs)) {
    Logger.debug('Global dependency changed: global JS entry');
    return true;
  }

  return false;
}

/**
 * Gets all file paths that should be tracked for a component
 */
export function getComponentFilePaths(handoff: Handoff, componentId: string, version: string): { files: string[]; templateDir?: string } {
  const runtimeComponent = handoff.runtimeConfig?.entries?.components?.[componentId]?.[version];
  if (!runtimeComponent) {
    return { files: [] };
  }

  const files: string[] = [];
  let templateDir: string | undefined;

  // Find the config file path for this component
  const configPaths = handoff.getConfigFilePaths();
  for (const configPath of configPaths) {
    // Check if this config path belongs to this component/version
    if (configPath.includes(componentId) && configPath.includes(version)) {
      files.push(configPath);
      break;
    }
  }

  // Add entry files
  const entries = runtimeComponent.entries as Record<string, string | undefined> | undefined;
  if (entries) {
    if (entries.js) {
      files.push(entries.js);
    }
    if (entries.scss) {
      files.push(entries.scss);
    }
    // Handle both 'template' (singular) and 'templates' (plural) entry types
    const templatePath = entries.template || entries.templates;
    if (templatePath) {
      try {
        const stat = fs.statSync(templatePath);
        if (stat.isDirectory()) {
          templateDir = templatePath;
        } else {
          files.push(templatePath);
        }
      } catch {
        // File doesn't exist, still add to track
        files.push(templatePath);
      }
    }
  }

  return { files, templateDir };
}

/**
 * Computes current file states for a component
 */
export async function computeComponentFileStates(
  handoff: Handoff,
  componentId: string,
  version: string
): Promise<{ files: Record<string, FileState>; templateDirFiles?: Record<string, FileState> }> {
  const { files: filePaths, templateDir } = getComponentFilePaths(handoff, componentId, version);

  const files: Record<string, FileState> = {};

  for (const filePath of filePaths) {
    const state = await computeFileState(filePath);
    if (state) {
      files[filePath] = state;
    }
  }

  let templateDirFiles: Record<string, FileState> | undefined;
  if (templateDir) {
    templateDirFiles = await computeDirectoryState(templateDir, ['.hbs', '.html']);
  }

  return { files, templateDirFiles };
}

/**
 * Checks if a component needs to be rebuilt based on file states
 */
export function hasComponentChanged(
  cached: ComponentCacheEntry | null | undefined,
  current: { files: Record<string, FileState>; templateDirFiles?: Record<string, FileState> }
): boolean {
  if (!cached) {
    return true; // No cache entry means new component
  }

  // Check regular files
  const cachedFiles = Object.keys(cached.files);
  const currentFiles = Object.keys(current.files);

  // Check if file count changed
  if (cachedFiles.length !== currentFiles.length) {
    return true;
  }

  // Check if any files were added or removed
  const cachedSet = new Set(cachedFiles);
  for (const file of currentFiles) {
    if (!cachedSet.has(file)) {
      return true;
    }
  }

  // Check if any file states changed
  for (const file of cachedFiles) {
    if (!statesMatch(cached.files[file], current.files[file])) {
      return true;
    }
  }

  // Check template directory files if applicable
  if (!directoryStatesMatch(cached.templateDirFiles, current.templateDirFiles)) {
    return true;
  }

  return false;
}

/**
 * Checks if the component output files exist
 */
export async function checkOutputExists(handoff: Handoff, componentId: string, version: string): Promise<boolean> {
  const outputPath = path.resolve(handoff.workingPath, 'public/api/component', componentId, `${version}.json`);
  return fs.pathExists(outputPath);
}

/**
 * Creates an empty cache structure
 */
export function createEmptyCache(): BuildCache {
  return {
    version: CACHE_VERSION,
    globalDeps: {},
    components: {},
  };
}

/**
 * Updates cache entry for a specific component version
 */
export function updateComponentCacheEntry(
  cache: BuildCache,
  componentId: string,
  version: string,
  fileStates: { files: Record<string, FileState>; templateDirFiles?: Record<string, FileState> }
): void {
  if (!cache.components[componentId]) {
    cache.components[componentId] = {};
  }

  cache.components[componentId][version] = {
    files: fileStates.files,
    templateDirFiles: fileStates.templateDirFiles,
    buildTimestamp: Date.now(),
  };
}

/**
 * Removes components from cache that are no longer in runtime config
 */
export function pruneRemovedComponents(cache: BuildCache, currentComponentIds: string[]): void {
  const currentSet = new Set(currentComponentIds);
  const cachedIds = Object.keys(cache.components);

  for (const cachedId of cachedIds) {
    if (!currentSet.has(cachedId)) {
      Logger.debug(`Pruning removed component from cache: ${cachedId}`);
      delete cache.components[cachedId];
    }
  }
}
