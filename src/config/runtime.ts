import esbuild from 'esbuild';
import fs from 'fs-extra';
import { createRequire } from 'module';
import path from 'path';
import {
  createDeprecationCollector,
  isCatalogItem,
  isInsideDirectory,
  normalizeCatalogItem,
  orderPreviews,
  readExportOrder,
  resolvePropertySource,
  type CatalogNormalizeResult,
  type DeprecationCollector,
} from '../catalog';
import { readDeprecatedApi } from '../declarations';
import { HOME_PAGE_ID, HOME_PAGE_PATH } from '../registry/content-kinds';
import { ComponentListObject, PatternListObject } from '../transformers/preview/types';
import { createCsfStoryPreviews } from '../transformers/utils/csf';
import { buildAndEvaluateModuleSync } from '../transformers/utils/module';
import { Config, ConfigFileEntry, RuntimeConfig } from '../types/config';
import { Logger } from '../utils/logger';
import { parseMarkdown } from '../utils/markdown';
import { collectPageSlugSegments } from '../utils/pages';
import { normalizePathForCompare } from '../utils/path';
import { normalizeComponentDeclaration } from './normalizers/declaration';
import { normalizePageDeclaration } from './normalizers/page';
import { normalizePatternDeclaration } from './normalizers/pattern';

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

export const resolveComponentDeclaration = (componentDir: string, componentBaseName: string): DeclarationResolution | null => {
  const modernMatch = findPreferredModernDeclaration(componentDir, componentBaseName);
  const legacyFiles = getLegacyDeclarationFiles(componentBaseName);
  const legacyMatch = legacyFiles.find((candidate) => fs.existsSync(path.resolve(componentDir, candidate)));

  if (modernMatch) {
    if (legacyMatch) {
      Logger.warn(
        `Both modern and legacy declarations found in "${componentDir}". Using "${modernMatch}" and ignoring "${legacyMatch}".`
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

const discoverCsfPreviews = (
  component: ComponentListObject,
  handoff: HandoffContext
): Record<string, any> | undefined => {
  if (component.renderer !== 'csf' || !component.entries?.template) {
    return component.previews;
  }

  try {
    const loaded = buildAndEvaluateModuleSync(component.entries.template, handoff);
    // esbuild emits its export map alphabetically, so story order comes from the source text.
    const discoveredPreviews = orderPreviews(
      createCsfStoryPreviews(loaded.exports as Record<string, any>),
      readExportOrder(component.entries.template)
    );

    if (Object.keys(discoveredPreviews).length === 0) {
      Logger.warn(
        `No named stories found in CSF file for "${component.id}": ${component.entries.template}`
      );
      return component.previews;
    }

    return discoveredPreviews;
  } catch (error) {
    Logger.warn(
      `Failed to discover CSF stories for "${component.id}" from "${component.entries.template}". Falling back to declared previews.`
    );
    Logger.debug('CSF discovery error', error);
    return component.previews;
  }
};

/**
 * Every directory registered as a catalog item, from `catalog.include` and from the deprecated
 * `entries.components` / `entries.patterns` keys. A path is either an item directory or a
 * collection directory whose subdirectories are each an item. Duplicates are dropped, so a
 * directory listed under both forms loads once.
 */
export const getCatalogItemDirectories = (config: Config, workingPath: string): string[] => {
  const registered = [
    ...(config.catalog?.include ?? []),
    ...(config.entries?.components ?? []),
    ...(config.entries?.patterns ?? []),
  ];

  const seen = new Set<string>();
  const directories: string[] = [];

  for (const entry of registered) {
    for (const directory of getComponentsForPath(path.resolve(workingPath, entry))) {
      const key = normalizePathForCompare(directory);
      if (seen.has(key)) continue;
      seen.add(key);
      directories.push(directory);
    }
  }

  return directories;
};

type ClassifyOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

/**
 * Decides which lane a declaration belongs to and returns the raw shape that lane's normalizer
 * accepts. A catalog item is recognized by `implementation` or `composition`; anything else came
 * from a deprecated API and is recorded for the single deprecation notice.
 */
const classifyDeclaration = (
  moduleExports: Record<string, any>,
  raw: Record<string, any>,
  options: ClassifyOptions,
  deprecations: DeprecationCollector
): CatalogNormalizeResult => {
  if (isCatalogItem(raw)) {
    return normalizeCatalogItem(moduleExports, options);
  }

  const legacyApi =
    readDeprecatedApi(raw) || (options.declarationPath.endsWith('.json') ? 'JSON declaration' : 'plain declaration object');
  deprecations.note(legacyApi, options.declarationPath);

  return Array.isArray(raw.components) ? { kind: 'pattern', raw } : { kind: 'component', raw };
};

/**
 * Records the React component a CSF file documents, so it is watched, documented, and published.
 * `csf-render` reads `meta.component` as a value; only the source text says which file it came
 * from. A component outside the item directory is left unrecorded, because publish rejects a
 * source path that escapes the entity directory.
 */
const resolveCsfComponentSource = (component: ComponentListObject): void => {
  if (component.renderer !== 'csf') return;

  const storyPath = component.entries?.story;
  if (!storyPath || component.entries?.component) return;

  const resolved = resolvePropertySource(storyPath, 'component');
  if (!resolved) return;

  if (!isInsideDirectory(resolved.file, component.path)) {
    Logger.warn(
      `Catalog item "${component.id}" documents a component at "${resolved.file}", outside "${component.path}". ` +
        `Previews still build, but that file is not published. Move it into the item directory to publish it.`
    );
    return;
  }

  component.entries.component = resolved.file;
};

/**
 * Initializes the runtime configuration by resolving component entries,
 * SCSS/JS paths, and transformer options from the handoff config.
 *
 * @param handoff - Object with config and workingPath.
 * @returns A tuple of [RuntimeConfig, configFilePaths, configFileIndex].
 */
export const initRuntimeConfig = (handoff: HandoffContext): [runtimeConfig: RuntimeConfig, configs: string[], configFileIndex: Map<string, ConfigFileEntry>] => {
  const configFiles: string[] = [];
  const configFileIndex = new Map<string, ConfigFileEntry>();
  const result: RuntimeConfig = {
    options: {},
    entries: {
      scss: undefined,
      js: undefined,
      components: {},
      patterns: {},
      pages: {},
    },
  };

  if (!!handoff.config.entries?.scss) {
    result.entries.scss = path.resolve(handoff.workingPath, handoff.config.entries?.scss);
  }
  if (!!handoff.config.entries?.js) {
    result.entries.js = path.resolve(handoff.workingPath, handoff.config.entries?.js);
  }

  const deprecations = createDeprecationCollector(
    (message) => Logger.warn(message),
    (source) => path.relative(handoff.workingPath, source) || source
  );

  if (handoff.config.entries?.components?.length || handoff.config.entries?.patterns?.length) {
    deprecations.note('entries.components / entries.patterns', 'handoff config');
  }

  // A directory's lane depends on what its declaration holds, not on which config key registered
  // it, so the declaration is loaded before the lane is chosen.
  for (const itemPath of getCatalogItemDirectories(handoff.config, handoff.workingPath)) {
    const itemBaseName = path.basename(itemPath);
    const declaration = resolveComponentDeclaration(itemPath, itemBaseName);

    if (!declaration) {
      const modernFiles = getModernDeclarationFiles(itemBaseName);
      const legacyFiles = getLegacyDeclarationFiles(itemBaseName);
      Logger.warn(`Missing config: ${path.resolve(itemPath, [...modernFiles, ...legacyFiles].join(' or '))}`);
      continue;
    }

    const declarationPath = path.resolve(itemPath, declaration.fileName);
    const indexKey = normalizePathForCompare(declarationPath);
    configFiles.push(declarationPath);

    // A declaration can be mid-edit under `start`, so every failure is a warning and the file is
    // retried on the next save. The index records it with an unknown kind, so a watcher does not
    // guess the wrong lane.
    const skip = (message: string, error: unknown): void => {
      Logger.warn(`${message}: ${declarationPath}`);
      Logger.debug('Declaration parse detail:', error);
      configFileIndex.set(indexKey, { kind: 'unknown', entityId: itemBaseName });
    };

    let classified: CatalogNormalizeResult;

    try {
      const moduleExports = loadDeclarationFile(declarationPath, handoff.modulePath);
      const rawDeclaration = moduleExports.default || moduleExports;
      classified = classifyDeclaration(
        moduleExports,
        rawDeclaration,
        { declarationPath, fallbackId: itemBaseName, warn: (message) => Logger.warn(message) },
        deprecations
      );
    } catch (err) {
      skip('Declaration skipped (incomplete or invalid) — will retry on next save', err);
      continue;
    }

    if (classified.kind === 'pattern') {
      let pattern: PatternListObject;

      try {
        pattern = normalizePatternDeclaration(classified.raw, {
          declarationPath,
          fallbackId: itemBaseName,
        });
      } catch (err) {
        skip('Composition skipped (incomplete or invalid) — will retry on next save', err);
        continue;
      }

      configFileIndex.set(indexKey, { kind: 'pattern', entityId: pattern.id });
      result.entries.patterns[pattern.id] = pattern;
      continue;
    }

    let component: ComponentListObject;

    try {
      component = normalizeComponentDeclaration(classified.raw, {
        declarationPath,
        fallbackId: itemBaseName,
        warn: (message) => Logger.warn(message),
      });
    } catch (err) {
      skip('Catalog item skipped (incomplete or invalid) — will retry on next save', err);
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

    // Discover CSF stories early so compositions can resolve stories like normal previews.
    component.previews = discoverCsfPreviews(component, handoff);
    resolveCsfComponentSource(component);

    // Save full component entry
    result.entries.components[component.id] = component;
    configFileIndex.set(indexKey, { kind: 'component', entityId: component.id });
  }

  // -------------------------------------------------------------------------
  // Discover markdown pages
  // -------------------------------------------------------------------------
  // Working pages under `<workingPath>/pages/` are first-class registry entities (publish/checkout).
  // The root `index.md` uses the stable id `index` but is served at `/`; nested index files remain
  // excluded because section indexes are owned by dedicated routes. Package defaults are not entities.
  const pagesRoot = path.resolve(handoff.workingPath, 'pages');
  for (const segments of collectPageSlugSegments(pagesRoot, { includeRootIndex: true })) {
    const slug = segments.join('/');
    const sourcePath = path.resolve(pagesRoot, `${slug}.md`);
    try {
      const { data: frontmatter } = parseMarkdown(fs.readFileSync(sourcePath, 'utf-8'));
      const routePath = slug === HOME_PAGE_ID ? HOME_PAGE_PATH : `/${slug}`;
      const page = normalizePageDeclaration(frontmatter, { id: slug, routePath, sourcePath });
      result.entries.pages[page.id] = page;
    } catch (err) {
      Logger.warn(`Page skipped (unreadable or invalid frontmatter): ${sourcePath}`);
      Logger.debug(`Page parse detail:`, err);
    }
  }

  // -------------------------------------------------------------------------
  // Inject synthetic previews from patterns onto components
  // -------------------------------------------------------------------------
  injectPatternPreviews(result);

  deprecations.flush();

  return [result, Array.from(configFiles), configFileIndex];
};

/**
 * True when `searchPath` is itself a single component directory: it holds a declaration file named
 * after the directory (`{dirname}.handoff.*`, or a legacy `{dirname}.{json,js,cjs}`). This is what
 * separates a declared component from a collection directory.
 */
export const isComponentDirectory = (searchPath: string): boolean =>
  !!resolveComponentDeclaration(searchPath, path.basename(searchPath));

/**
 * Returns the component directories for a given path. If `searchPath` is itself a component
 * directory it's returned as-is; otherwise each subdirectory is treated as a potential component.
 *
 * @param searchPath - The absolute path to check for components.
 * @returns Paths to the component directories.
 */
export const getComponentsForPath = (searchPath: string): string[] => {
  if (isComponentDirectory(searchPath)) {
    return [searchPath];
  }

  if (!fs.existsSync(searchPath)) {
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
 * Generic directory discovery for both components and patterns.
 * Reuses the same logic as getComponentsForPath.
 */
export const getItemsForPath = (searchPath: string): string[] => {
  return getComponentsForPath(searchPath);
};

/**
 * After both components and patterns are loaded, this function iterates all
 * pattern component refs and auto-registers synthetic preview entries on the
 * referenced components whenever custom args are specified.
 *
 * This ensures the component build renders every preview needed by patterns
 * so that pattern composition is purely file I/O (no rendering).
 */
const injectPatternPreviews = (result: RuntimeConfig): void => {
  const patterns = result.entries?.patterns ?? {};
  const components = result.entries?.components ?? {};

  for (const [patternId, pattern] of Object.entries(patterns)) {
    for (let i = 0; i < pattern.components.length; i++) {
      const ref = pattern.components[i];
      const component = components[ref.id];

      if (!component) {
        const error = `Pattern "${patternId}" references component "${ref.id}" which is not declared. This fragment will be skipped.`;
        Logger.warn(error);
        ref.resolved = false;
        continue;
      }

      // Case 1: only preview, no args -> use the existing preview as-is
      if (ref.preview && !ref.args) {
        if (component.previews?.[ref.preview]) {
          ref.resolved = true;
        } else {
          const error =
            `Pattern "${patternId}" references preview "${ref.preview}" on component "${ref.id}" which does not exist. This fragment may be skipped.`;
          Logger.warn(error);
          ref.resolved = false;
        }
        ref.resolvedPreview = ref.preview;
        continue;
      }

      // Case 2: no preview AND no args -> use the component's first existing preview (never assume "default")
      if (!ref.preview && !ref.args) {
        const previewKeys = Object.keys(component.previews || {});
        const firstPreview = previewKeys[0];
        if (firstPreview) {
          ref.resolvedPreview = firstPreview;
          ref.resolved = true;
        } else {
          Logger.warn(
            `Pattern "${patternId}" component ref "${ref.id}" has neither "preview" nor "args", and the component has no previews. This fragment will be skipped.`
          );
          ref.resolved = false;
        }
        continue;
      }

      // Case 3: args present (with or without preview base) -> create synthetic preview
      let resolvedValues: Record<string, any> = {};

      if (ref.preview) {
        const basePreview = component.previews?.[ref.preview];
        if (basePreview) {
          resolvedValues = { ...basePreview.values };
        } else {
          const error =
            `Pattern "${patternId}" references preview "${ref.preview}" on component "${ref.id}" which does not exist. Using args only.`;
          Logger.warn(error);
          ref.resolved = false;
        }
      }

      resolvedValues = { ...resolvedValues, ...ref.args };

      const syntheticKey = `__pattern_${patternId}_${i}`;

      component.internalPatternPreviews = component.internalPatternPreviews || {};
      component.internalPatternPreviews[syntheticKey] = {
        title: syntheticKey,
        values: resolvedValues,
        url: '',
        sourcePreview: ref.preview,
      };

      ref.resolvedPreview = syntheticKey;
      if (ref.resolved === undefined) {
        ref.resolved = true;
      }
    }
  }
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
