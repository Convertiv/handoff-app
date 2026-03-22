import esbuild from 'esbuild';
import fs from 'fs-extra';
import { createRequire } from 'module';
import path from 'path';
import { normalizeComponentDeclaration } from './normalizers/declaration';
import { ComponentListObject } from '../transformers/preview/types';
import { Config, RuntimeConfig } from '../types/config';
import { Logger } from '../utils/logger';

/**
 * Handoff instance shape needed by initRuntimeConfig.
 * Avoids importing the full Handoff class to prevent circular deps.
 */
interface HandoffContext {
  config: Config;
  workingPath: string;
  modulePath: string;
}

type DeclarationResolution = {
  fileName: string;
};

const MODERN_EXTENSIONS = ['ts', 'js', 'cjs', 'json'] as const;

const getLegacyDeclarationFiles = (componentBaseName: string): string[] => [
  `${componentBaseName}.json`,
  `${componentBaseName}.js`,
  `${componentBaseName}.cjs`,
];

const getModernDeclarationFiles = (componentBaseName: string): string[] =>
  MODERN_EXTENSIONS.map((ext) => `${componentBaseName}.handoff.${ext}`);

const findPreferredModernDeclaration = (componentDir: string, componentBaseName: string): string | undefined => {
  const exactCandidates = getModernDeclarationFiles(componentBaseName);
  const exactMatch = exactCandidates.find((candidate) => fs.existsSync(path.resolve(componentDir, candidate)));
  if (exactMatch) return exactMatch;

  const allFiles = fs.existsSync(componentDir) ? fs.readdirSync(componentDir) : [];
  const modernFiles = allFiles
    .filter((file) => /\.handoff\.(ts|js|cjs|json)$/.test(file))
    .sort((a, b) => a.localeCompare(b));

  if (!modernFiles.length) return undefined;

  for (const ext of MODERN_EXTENSIONS) {
    const extMatch = modernFiles.find((file) => file.endsWith(`.handoff.${ext}`));
    if (extMatch) return extMatch;
  }

  return modernFiles[0];
};

const resolveComponentDeclaration = (componentDir: string, componentBaseName: string): DeclarationResolution | null => {
  const modernMatch = findPreferredModernDeclaration(componentDir, componentBaseName);
  const legacyFiles = getLegacyDeclarationFiles(componentBaseName);
  const legacyMatch = legacyFiles.find((candidate) => fs.existsSync(path.resolve(componentDir, candidate)));

  if (modernMatch) {
    if (legacyMatch) {
      Logger.warn(
        `[handoff] Both modern and legacy declarations found in "${componentDir}". Using "${modernMatch}" and ignoring "${legacyMatch}".`
      );
    }
    return { fileName: modernMatch };
  }

  if (legacyMatch) {
    return { fileName: legacyMatch };
  }

  return null;
};

const evaluateTypeScriptDeclaration = (filePath: string, handoffModulePath: string): any => {
  const buildResult = esbuild.buildSync({
    entryPoints: [filePath],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    target: 'node16',
    logLevel: 'silent',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'handoff-app'],
  });

  const code = buildResult.outputFiles?.[0]?.text;
  if (!code) {
    throw new Error(`Unable to compile declaration file "${filePath}"`);
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

const loadDeclarationFile = (filePath: string, handoffModulePath: string): any => {
  if (filePath.endsWith('.json')) {
    const componentJson = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(componentJson);
  }

  if (filePath.endsWith('.ts')) {
    return evaluateTypeScriptDeclaration(filePath, handoffModulePath);
  }

  // Invalidate require cache to ensure fresh read
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
};

/**
 * Initializes the runtime configuration by resolving component entries,
 * SCSS/JS paths, and transformer options from the handoff config.
 *
 * @param handoff - Object with config and workingPath.
 * @returns A tuple of [RuntimeConfig, configFilePaths].
 */
export const initRuntimeConfig = (handoff: HandoffContext): [runtimeConfig: RuntimeConfig, configs: string[]] => {
  const configFiles: string[] = [];
  const result: RuntimeConfig = {
    options: {},
    entries: {
      scss: undefined,
      js: undefined,
      components: {},
    },
  };

  if (!!handoff.config.entries?.scss) {
    result.entries.scss = path.resolve(handoff.workingPath, handoff.config.entries?.scss);
  }
  if (!!handoff.config.entries?.js) {
    result.entries.js = path.resolve(handoff.workingPath, handoff.config.entries?.js);
  }

  if (handoff.config.entries?.components?.length) {
    const componentPaths = handoff.config.entries.components.flatMap(getComponentsForPath);
    for (const componentPath of componentPaths) {
      const resolvedComponentPath = path.resolve(handoff.workingPath, componentPath);
      const componentBaseName = path.basename(resolvedComponentPath);
      const declaration = resolveComponentDeclaration(resolvedComponentPath, componentBaseName);

      if (!declaration) {
        const modernFiles = getModernDeclarationFiles(componentBaseName);
        const legacyFiles = getLegacyDeclarationFiles(componentBaseName);
        Logger.warn(
          `Missing config: ${path.resolve(
            resolvedComponentPath,
            [...modernFiles, ...legacyFiles].join(' or ')
          )}`
        );
        continue;
      }

      const resolvedComponentConfigPath = path.resolve(resolvedComponentPath, declaration.fileName);
      configFiles.push(resolvedComponentConfigPath);

      let component: ComponentListObject;

      try {
        const importedDeclaration = loadDeclarationFile(resolvedComponentConfigPath, handoff.modulePath);
        const rawComponent = importedDeclaration.default || importedDeclaration;
        component = normalizeComponentDeclaration(rawComponent, {
          declarationPath: resolvedComponentConfigPath,
          fallbackId: componentBaseName,
          warn: (message) => Logger.warn(message),
        });
      } catch (err) {
        Logger.error(`Failed to read or parse config: ${resolvedComponentConfigPath}`, err);
        continue;
      }

      // Initialize options with safe defaults
      component.options ||= {
        transformer: { defaults: {}, replace: {} },
      };
      component.options.transformer ||= { defaults: {}, replace: {} };

      const transformer = component.options.transformer;
      transformer.cssRootClass ??= null;
      transformer.tokenNameSegments ??= null;

      // Normalize keys and values to lowercase
      transformer.defaults = toLowerCaseKeysAndValues({
        ...transformer.defaults,
      });

      transformer.replace = toLowerCaseKeysAndValues({
        ...transformer.replace,
      });

      // Save transformer config
      result.options[component.id] = transformer;

      // Save full component entry
      result.entries.components[component.id] = component;
    }
  }

  return [result, Array.from(configFiles)];
};

/**
 * Returns a list of component directories for a given path.
 *
 * This function determines whether the provided `searchPath` is:
 * 1. A single component directory (contains a config file named after the directory)
 * 2. A collection of component directories (subdirectories are components)
 *
 * A directory is considered a component if it contains a config file matching
 * `{dirname}.json`, `{dirname}.js`, or `{dirname}.cjs`.
 *
 * @param searchPath - The absolute path to check for components.
 * @returns An array of string paths to component directories.
 */
export const getComponentsForPath = (searchPath: string): string[] => {
  const dirName = path.basename(searchPath);
  const hasOwnConfig = !!resolveComponentDeclaration(searchPath, dirName);

  // Check if searchPath itself is a component directory (has a config file named after the directory)
  if (hasOwnConfig) {
    // This directory is a single component
    return [searchPath];
  }

  // Otherwise, treat each subdirectory as a potential component
  const subdirectories = fs
    .readdirSync(searchPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (subdirectories.length > 0) {
    // Return full paths to each subdirectory as potential component directories
    return subdirectories.map((subdir) => path.join(searchPath, subdir));
  }

  // Fallback: no config file and no subdirectories, return the path anyway
  // (will fail gracefully with "missing config" warning later)
  return [searchPath];
};

/**
 * Recursively converts all keys and string values in an object to lowercase.
 */
export const toLowerCaseKeysAndValues = (obj: Record<string, any>): Record<string, any> => {
  const loweredObj: Record<string, any> = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    const value = obj[key];

    if (typeof value === 'string') {
      loweredObj[lowerKey] = value.toLowerCase();
    } else if (typeof value === 'object' && value !== null) {
      loweredObj[lowerKey] = toLowerCaseKeysAndValues(value);
    } else {
      loweredObj[lowerKey] = value; // For non-string values
    }
  }
  return loweredObj;
};
