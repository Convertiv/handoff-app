import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';
import { collectModuleInputs } from '../transformers/utils/build';
import { Logger } from '../utils/logger';
import { normalizePathForCompare } from '../utils/path';
import { BuildInputs } from './build-inputs';
import { computeDirectoryState, computeFileState, directoryStatesMatch, FileState, statesMatch } from './file-state';

/** Current cache format version - bump when structure changes */
const CACHE_VERSION = '2.0.0';

/**
 * Cache entry for a single component
 */
export interface ComponentCacheEntry {
  /** File states for the declared source files of this component and every file its last build read */
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
  /** Global SCSS entry file state */
  globalScss?: FileState;
  /** Global JS entry file state */
  globalJs?: FileState;
  /** Main config file state. The build hooks are declared there */
  mainConfig?: FileState;
  /** Profile config file state */
  profileConfig?: FileState;
  /** Selected profile. All profiles write to the same output, so a switch invalidates all of it */
  profile?: string;
  /** Lockfile state. It stands in for the files under `node_modules`, which the cache does not track */
  lockfile?: FileState;
  /** handoff-app version that built the output */
  version?: string;
  /** Base path written into the generated HTML */
  basePath?: string;
}

const GLOBAL_FILE_DEPS = ['tokens', 'globalScss', 'globalJs', 'mainConfig', 'profileConfig', 'lockfile'] as const;
const GLOBAL_VALUE_DEPS = ['profile', 'version', 'basePath'] as const;

const LOCKFILE_NAMES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'];

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
export function getCachePath(handoff: Handoff): string {
  // The cache describes the output in the working directory, so it lives there too. A build deletes
  // the staged app under the package, so a cache there would not survive.
  return path.resolve(handoff.workingPath, '.handoff', '.cache', 'build-cache.json');
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

  // Global SCSS entry
  if (handoff.runtimeConfig?.entries?.scss) {
    result.globalScss = (await computeFileState(handoff.runtimeConfig.entries.scss)) ?? undefined;
  }

  // Global JS entry
  if (handoff.runtimeConfig?.entries?.js) {
    result.globalJs = (await computeFileState(handoff.runtimeConfig.entries.js)) ?? undefined;
  }

  const mainConfigPath = handoff.getMainConfigFilePath();
  if (mainConfigPath) {
    result.mainConfig = (await computeFileState(mainConfigPath)) ?? undefined;
  }

  const profileConfigPath = handoff.getProfileConfigFilePath();
  if (profileConfigPath) {
    result.profileConfig = (await computeFileState(profileConfigPath)) ?? undefined;
  }

  result.profile = handoff.getProfile();

  const lockfilePath = findLockfile(handoff.workingPath);
  if (lockfilePath) {
    result.lockfile = (await computeFileState(lockfilePath)) ?? undefined;
  }

  result.version = await readPackageVersion(handoff);
  result.basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  return result;
}

/** The nearest lockfile, searched up from the working directory so that a monorepo root lockfile is found. */
function findLockfile(fromDirectory: string): string | undefined {
  for (let directory = path.resolve(fromDirectory); ; directory = path.dirname(directory)) {
    const lockfile = LOCKFILE_NAMES.map((name) => path.join(directory, name)).find((file) => fs.existsSync(file));
    if (lockfile) return lockfile;
    if (path.dirname(directory) === directory) return undefined;
  }
}

async function readPackageVersion(handoff: Handoff): Promise<string | undefined> {
  try {
    return (await fs.readJson(path.resolve(handoff.modulePath, 'package.json'))).version;
  } catch {
    return undefined;
  }
}

/**
 * Checks if global dependencies have changed
 */
export function haveGlobalDepsChanged(cached: GlobalDepsState | null | undefined, current: GlobalDepsState): boolean {
  if (!cached) return true;

  for (const key of GLOBAL_FILE_DEPS) {
    if (!statesMatch(cached[key], current[key])) {
      Logger.debug(`Global dependency changed: ${key}`);
      return true;
    }
  }

  for (const key of GLOBAL_VALUE_DEPS) {
    if (cached[key] !== current[key]) {
      Logger.debug(`Global dependency changed: ${key}`);
      return true;
    }
  }

  return false;
}

/**
 * Gets all file paths that should be tracked for a component
 */
export function getComponentFilePaths(handoff: Handoff, componentId: string): { files: string[]; templateDir?: string } {
  const runtimeComponent = handoff.runtimeConfig?.entities.components[componentId];
  if (!runtimeComponent) {
    return { files: [] };
  }

  const files: string[] = [];
  let templateDir: string | undefined;
  const componentDirs = new Set<string>();

  // A catalog item declares its previews in the declaration file, and its implementation can sit
  // outside the item directory. The directories derived from `entries` below can therefore miss the
  // declaration, which would leave a preview edit uncached.
  if (runtimeComponent.path) {
    componentDirs.add(normalizePathForCompare(runtimeComponent.path));
  }

  // Add entry files and infer component directories from resolved entry paths
  const entries = runtimeComponent.entries as Record<string, string | undefined> | undefined;
  if (entries) {
    if (entries.js) {
      files.push(entries.js);
      componentDirs.add(normalizePathForCompare(path.dirname(entries.js)));
    }
    if (entries.scss) {
      files.push(entries.scss);
      componentDirs.add(normalizePathForCompare(path.dirname(entries.scss)));
    }
    // Handle template-style entries across renderer families
    const templatePath = entries.template || entries.templates || entries.component || entries.story;
    if (templatePath) {
      try {
        const stat = fs.statSync(templatePath);
        if (stat.isDirectory()) {
          templateDir = templatePath;
          componentDirs.add(normalizePathForCompare(templatePath));
        } else {
          files.push(templatePath);
          componentDirs.add(normalizePathForCompare(path.dirname(templatePath)));
        }
      } catch {
        // File doesn't exist, still add to track
        files.push(templatePath);
        componentDirs.add(normalizePathForCompare(path.dirname(templatePath)));
      }
    }
  }

  // Find the config file path for this component using exact config filename + directory matching.
  const configPaths = handoff.getConfigFilePaths();
  const matchingConfigPath = configPaths.find((configPath) => {
    const configFileName = path.basename(configPath);
    if (!/\.handoff\.(ts|js|cjs)$/.test(configFileName)) {
      return false;
    }

    if (componentDirs.size === 0) {
      return true;
    }

    const configDir = normalizePathForCompare(path.dirname(configPath));
    return componentDirs.has(configDir);
  });

  if (matchingConfigPath) {
    files.push(matchingConfigPath);
  }

  // Include every pattern config file whose declaration references this component.
  // When a pattern is added or modified, injectPatternPreviews injects new
  // __pattern_* synthetic preview keys onto the referenced component, changing
  // what processComponents must render. Without tracking these files here, the
  // cache would incorrectly consider the component unchanged and skip the preview
  // rebuild, leaving buildPatterns unable to find the required HTML fragments.
  const runtimePatterns = handoff.runtimeConfig?.entities.patterns ?? {};
  for (const configPath of configPaths) {
    const entry = handoff.getConfigFileEntry(configPath);
    if (entry?.kind !== 'pattern') continue;
    const pattern = runtimePatterns[entry.entityId];
    if (!pattern) continue;
    if (pattern.components?.some((ref) => ref.id === componentId)) {
      files.push(configPath);
    }
  }

  return { files, templateDir };
}

/**
 * Computes current file states for a component
 */
export async function computeComponentFileStates(
  handoff: Handoff,
  componentId: string
): Promise<{ files: Record<string, FileState>; templateDirFiles?: Record<string, FileState> }> {
  const { files: filePaths, templateDir } = getComponentFilePaths(handoff, componentId);

  const files: Record<string, FileState> = {};

  for (const filePath of filePaths) {
    const state = await computeFileState(filePath);
    if (state) {
      files[filePath] = state;
    }
  }

  let templateDirFiles: Record<string, FileState> | undefined;
  if (templateDir) {
    templateDirFiles = await computeDirectoryState(templateDir, ['.hbs', '.html', '.tsx', '.ts', '.jsx', '.js']);
  }

  return { files, templateDirFiles };
}

/**
 * Checks if a component needs to be rebuilt based on file states. This also compares the files that
 * the last build read with their current state on disk.
 */
export async function hasComponentChanged(
  cached: ComponentCacheEntry | null | undefined,
  current: { files: Record<string, FileState>; templateDirFiles?: Record<string, FileState> }
): Promise<boolean> {
  if (!cached) {
    return true; // No cache entry means new component
  }

  for (const [file, state] of Object.entries(current.files)) {
    if (!statesMatch(cached.files[file], state)) {
      return true;
    }
  }

  for (const [file, state] of Object.entries(cached.files)) {
    if (!(file in current.files) && !statesMatch(state, await computeFileState(file))) {
      return true;
    }
  }

  return !directoryStatesMatch(cached.templateDirFiles, current.templateDirFiles);
}

const SCRIPT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts']);

/**
 * File states for every file that the builds of a component read, or `null` when that list is
 * incomplete and the component must not be cached.
 *
 * Previews compile their sources with esbuild inside a Vite plugin, so Rollup does not see those
 * imports. The esbuild graph of each script entry supplies them. The lockfile covers the files under
 * `node_modules`, so they are skipped, together with the generated files in the output directory.
 */
export async function computeBuildInputStates(
  handoff: Handoff,
  componentId: string,
  inputs: BuildInputs
): Promise<Record<string, FileState> | null> {
  if (inputs.failed) {
    return null;
  }

  const files = new Set(inputs.files);
  const entries = handoff.runtimeConfig?.entities.components[componentId]?.entries as Record<string, string | undefined> | undefined;
  const scriptEntries = new Set(Object.values(entries ?? {}).filter((entry): entry is string => !!entry && SCRIPT_EXTENSIONS.has(path.extname(entry))));

  for (const entry of scriptEntries) {
    const moduleInputs = await collectModuleInputs(entry, handoff);
    if (!moduleInputs) {
      return null;
    }
    for (const file of moduleInputs) files.add(file);
  }

  const outputDirectory = path.resolve(handoff.workingPath, 'public/api/component');
  const states: Record<string, FileState> = {};

  for (const id of files) {
    const file = id.split('?')[0];
    if (!path.isAbsolute(file) || file.split(path.sep).includes('node_modules') || file.startsWith(outputDirectory + path.sep)) {
      continue;
    }
    const state = await computeFileState(file);
    if (state) {
      states[path.resolve(file)] = state;
    }
  }

  return states;
}

/**
 * Checks if the component output files exist
 */
export async function checkOutputExists(handoff: Handoff, componentId: string): Promise<boolean> {
  const outputDirectory = path.resolve(handoff.workingPath, 'public/api/component');
  const componentPath = path.resolve(outputDirectory, `${componentId}.json`);
  if (!(await fs.pathExists(componentPath))) {
    return false;
  }

  const runtimeComponent = handoff.runtimeConfig?.entities.components[componentId];
  const previewIds = new Set([
    ...Object.keys(runtimeComponent?.previews ?? {}),
    ...Object.keys(runtimeComponent?.internalPatternPreviews ?? {}),
  ]);

  try {
    const component = await fs.readJson(componentPath);
    for (const previewId of Object.keys(component?.previews ?? {})) {
      previewIds.add(previewId);
    }
  } catch {
    return false;
  }

  for (const previewId of previewIds) {
    const previewPath = path.resolve(outputDirectory, `${componentId}-${previewId}.html`);
    const inspectPath = path.resolve(outputDirectory, `${componentId}-${previewId}-inspect.html`);
    if (!(await fs.pathExists(previewPath)) || !(await fs.pathExists(inspectPath))) {
      return false;
    }
  }

  return true;
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
 * Updates cache entry for a specific component
 */
export function updateComponentCacheEntry(
  cache: BuildCache,
  componentId: string,
  fileStates: { files: Record<string, FileState>; templateDirFiles?: Record<string, FileState> },
  inputStates: Record<string, FileState>
): void {
  cache.components[componentId] = {
    files: { ...inputStates, ...fileStates.files },
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
