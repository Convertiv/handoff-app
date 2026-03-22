import fs from 'fs-extra';
import esbuild from 'esbuild';
import { createRequire } from 'module';
import path from 'path';
import { Config } from '../types/config';
import { Logger } from '../utils/logger';
import { defaultConfig } from './defaults';

const CONFIG_FILE_PREFERENCE = [
  'handoff.config.ts',
  'handoff.config.js',
  'handoff.config.cjs',
  'handoff.config.json',
] as const;

type ConfigLoadResult = {
  config: Config;
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
  if (configPath.endsWith('.json')) {
    const buffer = fs.readFileSync(configPath);
    return JSON.parse(buffer.toString()) as Config;
  }

  if (configPath.endsWith('.ts')) {
    const handoffModulePath = path.resolve(__dirname, '../..');
    const importedConfig = evaluateTypeScriptConfig(configPath, handoffModulePath);
    return (importedConfig.default || importedConfig) as Config;
  }

  // Invalidate require cache to ensure fresh read
  delete require.cache[require.resolve(configPath)];
  const importedConfig = require(configPath);
  return (importedConfig.default || importedConfig) as Config;
};

const resolveConfigFilePath = (): { selected?: string; ignored: string[] } => {
  const existing = CONFIG_FILE_PREFERENCE
    .map((fileName) => path.resolve(process.cwd(), fileName))
    .filter((filePath) => fs.existsSync(filePath));

  if (!existing.length) {
    return { selected: undefined, ignored: [] };
  }

  const [selected, ...ignored] = existing;
  return { selected, ignored };
};

/**
 * Loads the handoff configuration from the project root and returns metadata.
 */
export const initConfigWithMetadata = (configOverride?: Partial<Config>): ConfigLoadResult => {
  let config: Partial<Config> = {};
  const { selected: configPath, ignored } = resolveConfigFilePath();

  if (ignored.length > 0 && configPath) {
    Logger.warn(
      `[handoff] Multiple config files found. Using "${path.basename(configPath)}" and ignoring: ${ignored
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

  const resolvedConfig = { ...defaultConfig(), ...config } as Config;
  return { config: resolvedConfig, configPath };
};

/**
 * Loads the handoff configuration from the project root.
 *
 * Searches for config files in order: handoff.config.ts, handoff.config.js, handoff.config.cjs, handoff.config.json.
 * Merges file config with any provided overrides, then applies defaults for missing values.
 *
 * @param configOverride - Optional partial config to override file-loaded values.
 * @returns The fully resolved Config object.
 */
export const initConfig = (configOverride?: Partial<Config>): Config => {
  return initConfigWithMetadata(configOverride).config;
};
