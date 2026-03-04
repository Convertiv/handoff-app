import fs from 'fs-extra';
import path from 'path';
import { PageListObject } from '../transformers/preview/page/types';
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
}

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
      pages: {},
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
      const possibleConfigFiles = [`${componentBaseName}.json`, `${componentBaseName}.js`, `${componentBaseName}.cjs`];

      const configFileName = possibleConfigFiles.find((file) => fs.existsSync(path.resolve(resolvedComponentPath, file)));

      if (!configFileName) {
        Logger.warn(`Missing config: ${path.resolve(resolvedComponentPath, possibleConfigFiles.join(' or '))}`);
        continue;
      }

      const resolvedComponentConfigPath = path.resolve(resolvedComponentPath, configFileName);
      configFiles.push(resolvedComponentConfigPath);

      let component: ComponentListObject;

      try {
        if (configFileName.endsWith('.json')) {
          const componentJson = fs.readFileSync(resolvedComponentConfigPath, 'utf8');
          component = JSON.parse(componentJson) as ComponentListObject;
        } else {
          // Invalidate require cache to ensure fresh read
          delete require.cache[require.resolve(resolvedComponentConfigPath)];
          const importedComponent = require(resolvedComponentConfigPath);
          component = importedComponent.default || importedComponent;
        }
      } catch (err) {
        Logger.error(`Failed to read or parse config: ${resolvedComponentConfigPath}`, err);
        continue;
      }

      // Use component basename as the id
      component.id = componentBaseName;

      // Resolve entry paths relative to component directory
      if (component.entries) {
        for (const entryType in component.entries) {
          if (component.entries[entryType]) {
            component.entries[entryType] = path.resolve(resolvedComponentPath, component.entries[entryType]);
          }
        }
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

  if (handoff.config.entries?.pages?.length) {
    const pagePaths = handoff.config.entries.pages.flatMap(getPagesForPath);
    for (const pagePath of pagePaths) {
      const resolvedPagePath = path.resolve(handoff.workingPath, pagePath);
      const pageBaseName = path.basename(resolvedPagePath);
      const possibleConfigFiles = [`${pageBaseName}.json`, `${pageBaseName}.js`, `${pageBaseName}.cjs`];

      const configFileName = possibleConfigFiles.find((file) => fs.existsSync(path.resolve(resolvedPagePath, file)));

      if (!configFileName) {
        Logger.warn(`Missing page config: ${path.resolve(resolvedPagePath, possibleConfigFiles.join(' or '))}`);
        continue;
      }

      const resolvedPageConfigPath = path.resolve(resolvedPagePath, configFileName);
      configFiles.push(resolvedPageConfigPath);

      let page: PageListObject;

      try {
        if (configFileName.endsWith('.json')) {
          const pageJson = fs.readFileSync(resolvedPageConfigPath, 'utf8');
          page = JSON.parse(pageJson) as PageListObject;
        } else {
          delete require.cache[require.resolve(resolvedPageConfigPath)];
          const importedPage = require(resolvedPageConfigPath);
          page = importedPage.default || importedPage;
        }
      } catch (err) {
        Logger.error(`Failed to read or parse page config: ${resolvedPageConfigPath}`, err);
        continue;
      }

      page.id = pageBaseName;

      // Validate that referenced components exist
      if (page.components) {
        for (const componentId of page.components) {
          if (!result.entries.components[componentId]) {
            Logger.warn(`Page '${page.id}' references unknown component '${componentId}'`);
          }
        }
      }

      result.entries.pages[page.id] = page;
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
  const possibleConfigFiles = [`${dirName}.json`, `${dirName}.js`, `${dirName}.cjs`];

  // Check if searchPath itself is a component directory (has a config file named after the directory)
  const hasOwnConfig = possibleConfigFiles.some((file) => fs.existsSync(path.resolve(searchPath, file)));

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
 * Returns a list of page directories for a given path.
 * Mirrors getComponentsForPath but for page definitions.
 */
export const getPagesForPath = (searchPath: string): string[] => {
  const dirName = path.basename(searchPath);
  const possibleConfigFiles = [`${dirName}.json`, `${dirName}.js`, `${dirName}.cjs`];

  const hasOwnConfig = possibleConfigFiles.some((file) => fs.existsSync(path.resolve(searchPath, file)));

  if (hasOwnConfig) {
    return [searchPath];
  }

  const subdirectories = fs
    .readdirSync(searchPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (subdirectories.length > 0) {
    return subdirectories.map((subdir) => path.join(searchPath, subdir));
  }

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
