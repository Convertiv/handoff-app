import esbuild from 'esbuild';
import fs from 'fs-extra';
import mergeWith from 'lodash/mergeWith';
import { createRequire } from 'module';
import path from 'path';
import { Config, ResolvedConfig } from '../types/config';
import { Logger } from '../utils/logger';
import { resolveWorkingPath } from '../utils/path';
import { defaultConfig } from './defaults';
import { loadProfileEnv } from './env';
import { normalizeConfig } from './helpers';
import { HandoffConfigError } from './errors';
import { isEnvReference } from './from-env';
import { resolveConfigEnv } from './resolve-env';

export const CONFIG_FILE_PREFERENCE = [
  'handoff.config.ts',
  'handoff.config.js',
  'handoff.config.cjs',
  'handoff.config.json',
] as const;

/** Extensions the loader knows how to evaluate, derived from the discoverable file names. */
const SUPPORTED_CONFIG_EXTENSIONS = Array.from(new Set(CONFIG_FILE_PREFERENCE.map((fileName) => path.extname(fileName))));

/** A profile name becomes part of a file name, so it stays lowercase letters, numbers, and hyphens. */
const PROFILE_NAME_PATTERN = /^[a-z0-9-]+$/;

export { HandoffConfigError } from './errors';

type ConfigLoadResult = {
  config: ResolvedConfig;
  configPath?: string;
  profile?: string;
  /** The profile file merged onto the base config. */
  profileConfigPath?: string;
};

/** Where to look for the config: the working directory, plus an optional explicit file. */
export type ConfigLoadContext = {
  /** Directory relative config paths resolve from, and the root that gets searched. */
  workingPath?: string;
  /** Explicit config file (the CLI's `-c, --config`), replacing discovery entirely. */
  configPath?: string;
  /** Profile to merge onto the base config (the CLI's `--profile`), overriding `HANDOFF_PROFILE`. */
  profile?: string;
  /**
   * Profile names that resolve without a `handoff.config.<profile>.*` file, leaving the base config
   * unchanged. Registry commands pass the names of saved logins, because there a profile selects the
   * registry rather than a config layer.
   */
  knownProfiles?: string[];
  /** Sentence appended when a selected profile matches neither a config file nor `knownProfiles`. */
  profileNotFoundHint?: string;
};

/** Which selector picked the profile, so an error can name the one the user set. */
type ProfileSelection = { name: string; source: '--profile' | 'HANDOFF_PROFILE' };

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
 * Normalize here and not only in `defineConfig`: a `.json` config, or a profile that skips the
 * helper, would otherwise keep its camelCase keys. The rest of the codebase reads the runtime keys,
 * so a later layer could not override an earlier one.
 */
const loadConfigLayer = (configPath: string): Partial<Config> => normalizeConfig(loadConfigFile(configPath));

const pickExisting = (candidates: string[]): { selected?: string; ignored: string[] } => {
  const existing = candidates.filter((filePath) => fs.existsSync(filePath));

  if (!existing.length) {
    return { selected: undefined, ignored: [] };
  }

  const [selected, ...ignored] = existing;
  return { selected, ignored };
};

const warnIgnored = (selected: string | undefined, ignored: string[]): void => {
  if (!selected || ignored.length === 0) {
    return;
  }

  Logger.warn(
    `Multiple config files found. Using "${path.basename(selected)}" and ignoring: ${ignored
      .map((filePath) => `"${path.basename(filePath)}"`)
      .join(', ')}.`
  );
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

  return pickExisting(CONFIG_FILE_PREFERENCE.map((fileName) => path.resolve(workingPath, fileName)));
};

/** `--profile` wins over `HANDOFF_PROFILE`, and an empty value counts as unset. */
export const resolveProfileSelection = (requestedProfile?: string): ProfileSelection | undefined => {
  const fromOption = requestedProfile?.trim();
  if (fromOption) {
    return { name: fromOption, source: '--profile' };
  }

  const fromEnvironment = process.env.HANDOFF_PROFILE?.trim();
  if (fromEnvironment) {
    return { name: fromEnvironment, source: 'HANDOFF_PROFILE' };
  }

  return undefined;
};

/**
 * Picks the profile file for a selected profile. It sits beside the base config: the base file name
 * without its extension, then the profile name, then any config extension. So `handoff.config.ts`
 * pairs with `handoff.config.local.*`, and a config named through `-c` keeps its own name. A selected
 * profile has to resolve - silently falling back to the base config would deploy the wrong settings.
 * A name listed in `knownProfiles` resolves without a file, because it names something else that
 * exists, such as a saved registry login.
 */
const resolveProfileFilePath = (
  workingPath: string,
  baseConfigPath: string | undefined,
  selection: ProfileSelection,
  context: ConfigLoadContext
): string | undefined => {
  if (!PROFILE_NAME_PATTERN.test(selection.name)) {
    throw new HandoffConfigError(
      `Invalid config profile "${selection.name}" (from ${selection.source}). ` +
        `A profile name can contain lowercase letters, numbers, and hyphens.`
    );
  }

  const baseName = baseConfigPath
    ? path.join(path.dirname(baseConfigPath), path.basename(baseConfigPath, path.extname(baseConfigPath)))
    : path.resolve(workingPath, 'handoff.config');
  const candidates = SUPPORTED_CONFIG_EXTENSIONS.map((extension) => `${baseName}.${selection.name}${extension}`);
  const { selected, ignored } = pickExisting(candidates);

  if (!selected) {
    if (context.knownProfiles?.includes(selection.name)) {
      return undefined;
    }
    throw new HandoffConfigError(
      `Config profile "${selection.name}" (from ${selection.source}) not found. ` +
        `Create one of: ${candidates.map((candidate) => path.basename(candidate)).join(', ')} in ${path.dirname(candidates[0])}.` +
        (context.profileNotFoundHint ? ` ${context.profileNotFoundHint}` : '')
    );
  }

  warnIgnored(selected, ignored);
  return selected;
};

/**
 * Arrays and environment references are whole values: a later layer replaces them, including
 * any reference default. Everything else keeps lodash semantics: plain
 * objects merge recursively, scalars, `null` and functions replace, and `undefined` is skipped.
 */
const replaceValues = (destination: unknown, source: unknown) => {
  if (source === undefined) return undefined;
  return Array.isArray(source) || isEnvReference(source) || isEnvReference(destination) ? source : undefined;
};

/**
 * Loads the handoff configuration for the given working directory and returns metadata.
 */
export const initConfigWithMetadata = (configOverride?: Partial<Config>, context?: ConfigLoadContext): ConfigLoadResult => {
  const workingPath = context?.workingPath ?? resolveWorkingPath();
  const { selected: configPath, ignored } = resolveConfigFilePath(workingPath, context?.configPath);
  warnIgnored(configPath, ignored);

  const profileSelection = resolveProfileSelection(context?.profile);
  const profileConfigPath = profileSelection ? resolveProfileFilePath(workingPath, configPath, profileSelection, context ?? {}) : undefined;

  // Profile environment values must be present before the merged references resolve.
  loadProfileEnv(profileSelection?.name);

  const layers: Partial<Config>[] = [defaultConfig()];
  if (configPath) {
    layers.push(loadConfigLayer(configPath));
  }
  if (profileConfigPath) {
    layers.push(loadConfigLayer(profileConfigPath));
  }
  if (configOverride) {
    layers.push(normalizeConfig(configOverride as Config));
  }

  const profileLabel = profileSelection
    ? `"${profileSelection.name}" (from ${profileSelection.source})${profileConfigPath ? '' : ' - no config file, the base config is used unchanged'}`
    : 'none selected';
  Logger.debug(`Config profile: ${profileLabel}`);
  Logger.debug(`Config files loaded: ${[configPath, profileConfigPath].filter(Boolean).join(', ') || 'none, using defaults'}`);

  const merged = mergeWith({}, ...layers, replaceValues) as Config;
  const config = resolveConfigEnv(merged, profileSelection?.name, layers[0]);

  // Guards run on the resolved config so a profile cannot slip a removed setting past them.
  const entries = config.entries as Record<string, unknown> | undefined;
  if (entries && ('components' in entries || 'patterns' in entries)) {
    throw new HandoffConfigError(
      'entries.components and entries.patterns were removed. Use catalog.include. See UPGRADE.md#catalog-items.'
    );
  }
  const format = config.runtime?.workspace?.declarationFormat;
  if (format !== undefined && !['ts', 'js', 'cjs'].includes(format)) {
    throw new HandoffConfigError(
      'Item declarations support ts, js, and cjs. Convert JSON declarations to defineCatalogItem. See UPGRADE.md#catalog-items.'
    );
  }

  return { config, configPath, profile: profileSelection?.name, profileConfigPath };
};

/**
 * Loads the handoff configuration for the given working directory.
 *
 * Searches for config files in order: handoff.config.ts, handoff.config.js, handoff.config.cjs, handoff.config.json,
 * unless `context.configPath` names one explicitly. A selected profile adds a `handoff.config.<profile>.*` sidecar,
 * which only `context.knownProfiles` makes optional.
 * Layers resolve as defaults, base config, profile, then the given overrides, merging plain objects recursively.
 *
 * @param configOverride - Optional partial config to override file-loaded values.
 * @param context - Optional working directory, explicit config file, and profile to load.
 * @returns The fully resolved Config object.
 */
export const initConfig = (configOverride?: Partial<Config>, context?: ConfigLoadContext): ResolvedConfig => {
  return initConfigWithMetadata(configOverride, context).config;
};
