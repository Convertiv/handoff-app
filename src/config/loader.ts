import esbuild from 'esbuild';
import fs from 'fs-extra';
import merge from 'lodash/merge';
import { createRequire } from 'module';
import path from 'path';
import { Config } from '../types/config';
import { Logger } from '../utils/logger';
import { resolveWorkingPath } from '../utils/path';
import { defaultConfig } from './defaults';

const CONFIG_FILE_PREFERENCE = [
  'handoff.config.ts',
  'handoff.config.js',
  'handoff.config.cjs',
  'handoff.config.json',
] as const;

/** Extensions the loader knows how to evaluate, derived from the discoverable file names. */
const SUPPORTED_CONFIG_EXTENSIONS = Array.from(new Set(CONFIG_FILE_PREFERENCE.map((fileName) => path.extname(fileName))));

/** Raised when an explicitly requested config file cannot be used. */
export class HandoffConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandoffConfigError';
  }
}

type ConfigLoadResult = {
  config: Config;
  configPath?: string;
};

/** Where to look for the config: the working directory, plus an optional explicit file. */
export type ConfigLoadContext = {
  /** Directory relative config paths resolve from, and the root that gets searched. */
  workingPath?: string;
  /** Explicit config file (the CLI's `-c, --config`), replacing discovery entirely. */
  configPath?: string;
};

const evaluateTypeScriptConfig = (filePath: string, handoffModulePath: string): any => {
  const buildResult = esbuild.buildSync({
    entryPoints: [filePath],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    target: 'node16',
    logLevel: 'silent',
    external: ['handoff-app'],
  });

  const code = buildResult.outputFiles?.[0]?.text;
  if (!code) {
    throw new Error(`Unable to compile config file "${filePath}"`);
  }

  const mod: any = { exports: {} };
  const localRequire = createRequire(filePath);
  const handoffRequire = createRequire(path.resolve(handoffModulePath, 'package.json'));
  const runtimeRequire = (id: string) => {
    try {
      return localRequire(id);
    } catch {
      return handoffRequire(id);
    }
  };
  const evaluator = new Function('require', 'module', 'exports', '__filename', '__dirname', code);
  evaluator(runtimeRequire, mod, mod.exports, filePath, path.dirname(filePath));
  return mod.exports;
};

const loadConfigFile = (configPath: string): Config => {
  const extension = path.extname(configPath);

  if (extension === '.json') {
    const buffer = fs.readFileSync(configPath);
    return JSON.parse(buffer.toString()) as Config;
  }

  if (extension === '.ts') {
    const handoffModulePath = path.resolve(__dirname, '../..');
    const importedConfig = evaluateTypeScriptConfig(configPath, handoffModulePath);
    return (importedConfig.default || importedConfig) as Config;
  }

  // Invalidate require cache to ensure fresh read
  delete require.cache[require.resolve(configPath)];
  const importedConfig = require(configPath);
  return (importedConfig.default || importedConfig) as Config;
};

/**
 * Picks the config file to load. An explicitly requested file replaces discovery - it is resolved
 * from `workingPath` and must exist in a format the loader can evaluate. Otherwise every known
 * config name is looked for in `workingPath`, the first match winning.
 */
const resolveConfigFilePath = (workingPath: string, requestedPath?: string): { selected?: string; ignored: string[] } => {
  if (requestedPath) {
    const selected = path.resolve(workingPath, requestedPath);

    if (!fs.existsSync(selected)) {
      throw new HandoffConfigError(`Config file not found: "${requestedPath}" (resolved to ${selected})`);
    }

    if (!SUPPORTED_CONFIG_EXTENSIONS.includes(path.extname(selected))) {
      throw new HandoffConfigError(
        `Unsupported config file "${path.basename(selected)}". Supported extensions: ${SUPPORTED_CONFIG_EXTENSIONS.join(', ')}`
      );
    }

    return { selected, ignored: [] };
  }

  const existing = CONFIG_FILE_PREFERENCE
    .map((fileName) => path.resolve(workingPath, fileName))
    .filter((filePath) => fs.existsSync(filePath));

  if (!existing.length) {
    return { selected: undefined, ignored: [] };
  }

  const [selected, ...ignored] = existing;
  return { selected, ignored };
};

/**
 * Loads the handoff configuration for the given working directory and returns metadata.
 */
export const initConfigWithMetadata = (configOverride?: Partial<Config>, context?: ConfigLoadContext): ConfigLoadResult => {
  let config: Partial<Config> = {};
  const { selected: configPath, ignored } = resolveConfigFilePath(context?.workingPath ?? resolveWorkingPath(), context?.configPath);

  if (ignored.length > 0 && configPath) {
    Logger.warn(
      `Multiple config files found. Using "${path.basename(configPath)}" and ignoring: ${ignored
        .map((filePath) => `"${path.basename(filePath)}"`)
        .join(', ')}.`
    );
  }

  if (configPath) {
    config = loadConfigFile(configPath);
  }

  // Apply overrides if provided
  if (configOverride) {
    (Object.entries(configOverride) as [keyof Config, Config[keyof Config]][]).forEach(([key, value]) => {
      if (value !== undefined) {
        (config as Record<string, unknown>)[key as string] = value;
      }
    });
  }

  const defaults = defaultConfig();
  // Top-level merge stays shallow to preserve 1.x semantics, except for the `runtime`
  // block which is deep-merged so a partial user `runtime` (e.g. only `mode`) does not
  // wipe the defaults supplied for the rest of the block.
  const resolvedConfig = {
    ...defaults,
    ...config,
    runtime: merge({}, defaults.runtime, config.runtime),
  } as Config;
  return { config: resolvedConfig, configPath };
};

/**
 * Loads the handoff configuration for the given working directory.
 *
 * Searches for config files in order: handoff.config.ts, handoff.config.js, handoff.config.cjs, handoff.config.json,
 * unless `context.configPath` names one explicitly. Merges file config with any provided overrides,
 * then applies defaults for missing values.
 *
 * @param configOverride - Optional partial config to override file-loaded values.
 * @param context - Optional working directory and explicit config file to load.
 * @returns The fully resolved Config object.
 */
export const initConfig = (configOverride?: Partial<Config>, context?: ConfigLoadContext): Config => {
  return initConfigWithMetadata(configOverride, context).config;
};
