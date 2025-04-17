import chalk from 'chalk';
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import buildApp, { devApp, watchApp } from './app';
import { ejectConfig, ejectExportables, ejectPages, ejectTheme, makeIntegration } from './cli/eject';
import { makeComponent, makeExportable, makePage, makeTemplate } from './cli/make';
import { defaultConfig } from './config';
import pipeline, { buildComponents, buildIntegrationOnly, buildRecipe } from './pipeline';
import { processSharedStyles } from './transformers/preview/component';
import processComponents from './transformers/preview/component/builder';
import { buildMainCss } from './transformers/preview/component/css';
import { buildMainJS } from './transformers/preview/component/javascript';
import { renameComponent } from './transformers/preview/component/rename';
import { ComponentListObject } from './transformers/preview/types';
import { DocumentationObject } from './types';
import { Config, IntegrationObject } from './types/config';

class Handoff {
  config: Config | null;
  debug: boolean = false;
  force: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = process.cwd();
  exportsDirectory: string = 'exported';
  sitesDirectory: string = 'out';
  integrationObject?: IntegrationObject | null;
  designMap: {
    colors: {};
    effects: {};
    typography: {};
  };

  private _initialArgs: { debug?: boolean; force?: boolean; config?: Partial<Config> } = {};
  private _configFilePaths: string[] = [];
  private _documentationObjectCache?: DocumentationObject;
  private _sharedStylesCache?: string | null;

  constructor(debug?: boolean, force?: boolean, config?: Partial<Config>) {
    this._initialArgs = { debug, force, config };
    this.construct(debug, force, config);
  }

  private construct(debug?: boolean, force?: boolean, config?: Partial<Config>) {
    this.config = null;
    this.debug = debug ?? false;
    this.force = force ?? false;
    this.init(config);
    global.handoff = this;
  }

  init(configOverride?: Partial<Config>): Handoff {
    const config = initConfig(configOverride ?? {});
    this.config = config;
    this.exportsDirectory = config.exportsOutputDirectory ?? this.exportsDirectory;
    this.sitesDirectory = config.sitesOutputDirectory ?? this.exportsDirectory;
    [this.integrationObject, this._configFilePaths] = initIntegrationObject(this);
    return this;
  }

  reload(): Handoff {
    this.construct(this._initialArgs.debug, this._initialArgs.force, this._initialArgs.config);
    return this;
  }

  preRunner(validate?: boolean): Handoff {
    if (!this.config) {
      throw Error('Handoff not initialized');
    }
    if (validate) {
      this.config = validateConfig(this.config);
    }
    return this;
  }

  async fetch(): Promise<Handoff> {
    this.preRunner();
    await pipeline(this);
    return this;
  }

  async recipe(): Promise<Handoff> {
    this.preRunner();
    await buildRecipe(this);
    return this;
  }

  async component(name: string | null): Promise<Handoff> {
    this.preRunner();

    if (name) {
      name = name.replace('.hbs', '');
      await processComponents(this, name);
    } else {
      await buildComponents(this);
    }

    return this;
  }

  async renameComponent(oldName: string, target: string): Promise<Handoff> {
    this.preRunner();
    await renameComponent(this, oldName, target);
    return this;
  }

  async integration(): Promise<Handoff> {
    this.preRunner();
    await buildIntegrationOnly(this);
    await buildComponents(this);
    return this;
  }

  async build(): Promise<Handoff> {
    this.preRunner();
    await buildApp(this);
    return this;
  }

  async ejectConfig(): Promise<Handoff> {
    this.preRunner();
    await ejectConfig(this);
    return this;
  }

  async ejectIntegration(): Promise<Handoff> {
    this.preRunner();
    await makeIntegration(this);
    return this;
  }

  async ejectExportables(): Promise<Handoff> {
    this.preRunner();
    await ejectExportables(this);
    return this;
  }

  async ejectPages(): Promise<Handoff> {
    this.preRunner();
    await ejectPages(this);
    return this;
  }

  async ejectTheme(): Promise<Handoff> {
    this.preRunner();
    await ejectTheme(this);
    return this;
  }

  async makeExportable(type: string, name: string): Promise<Handoff> {
    this.preRunner();
    await makeExportable(this, type, name);
    return this;
  }

  async makeTemplate(component: string, state: string): Promise<Handoff> {
    this.preRunner();
    await makeTemplate(this, component, state);
    return this;
  }

  async makePage(name: string, parent: string): Promise<Handoff> {
    this.preRunner();
    await makePage(this, name, parent);
    return this;
  }

  async makeComponent(name: string): Promise<Handoff> {
    this.preRunner();
    await makeComponent(this, name);
    return this;
  }

  async makeIntegration(): Promise<Handoff> {
    this.preRunner();
    await makeIntegration(this);
    return this;
  }

  async makeIntegrationStyles(): Promise<Handoff> {
    this.preRunner();
    await buildMainJS(this);
    await buildMainCss(this);
    return this;
  }

  async start(): Promise<Handoff> {
    this.preRunner();
    await watchApp(this);
    return this;
  }

  async dev(): Promise<Handoff> {
    this.preRunner();
    await devApp(this);
    return this;
  }

  async validateComponents(): Promise<Handoff> {
    this.preRunner();
    await processComponents(this, undefined, 'validation');
    return this;
  }

  /**
   * Retrieves the documentation object, using cached version if available
   * @returns {Promise<DocumentationObject | undefined>} The documentation object or undefined if not found
   */
  async getDocumentationObject(): Promise<DocumentationObject | undefined> {
    if (this._documentationObjectCache) {
      return this._documentationObjectCache;
    }
    const documentationObject = await this.readJsonFile(this.getTokensFilePath());
    this._documentationObjectCache = documentationObject;
    return documentationObject;
  }

  /**
   * Retrieves shared styles, using cached version if available
   * @returns {Promise<string | null>} The shared styles string or null if not found
   */
  async getSharedStyles(): Promise<string | null> {
    if (this._sharedStylesCache !== undefined) {
      return this._sharedStylesCache;
    }
    const sharedStyles = await processSharedStyles(this);
    this._sharedStylesCache = sharedStyles;
    return sharedStyles;
  }

  /**
   * Gets the output path for the current project
   * @returns {string} The absolute path to the output directory
   */
  getOutputPath(): string {
    return path.resolve(this.workingPath, this.exportsDirectory, this.config.figma_project_id);
  }

  /**
   * Gets the path to the tokens.json file
   * @returns {string} The absolute path to the tokens.json file
   */
  getTokensFilePath(): string {
    return path.join(this.getOutputPath(), 'tokens.json');
  }

  /**
   * Gets the path to the preview.json file
   * @returns {string} The absolute path to the preview.json file
   */
  getPreviewFilePath(): string {
    return path.join(this.getOutputPath(), 'preview.json');
  }

  /**
   * Gets the path to the changelog.json file
   * @returns {string} The absolute path to the changelog.json file
   */
  getChangelogFilePath(): string {
    return path.join(this.getOutputPath(), 'changelog.json');
  }

  /**
   * Gets the path to the tokens directory
   * @returns {string} The absolute path to the tokens directory
   */
  getVariablesFilePath(): string {
    return path.join(this.getOutputPath(), 'tokens');
  }

  /**
   * Gets the path to the icons.zip file
   * @returns {string} The absolute path to the icons.zip file
   */
  getIconsZipFilePath(): string {
    return path.join(this.getOutputPath(), 'icons.zip');
  }

  /**
   * Gets the path to the logos.zip file
   * @returns {string} The absolute path to the logos.zip file
   */
  getLogosZipFilePath(): string {
    return path.join(this.getOutputPath(), 'logos.zip');
  }

  /**
   * Gets the list of config file paths
   * @returns {string[]} Array of absolute paths to config files
   */
  getConfigFilePaths(): string[] {
    return this._configFilePaths;
  }

  /**
   * Clears all cached data
   * @returns {void}
   */
  clearCaches(): void {
    this._documentationObjectCache = undefined;
    this._sharedStylesCache = undefined;
  }

  /**
   * Reads and parses a JSON file
   * @param {string} path - Path to the JSON file
   * @returns {Promise<any>} The parsed JSON content or undefined if file cannot be read
   */
  private async readJsonFile(path: string) {
    try {
      return await fs.readJSON(path);
    } catch (e) {
      return undefined;
    }
  }
}

const initConfig = (configOverride?: Partial<Config>): Config => {
  let config = {};

  const possibleConfigFiles = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'];

  // Find the first existing config file
  const configFile = possibleConfigFiles.find((file) => fs.existsSync(path.resolve(process.cwd(), file)));

  if (configFile) {
    const configPath = path.resolve(process.cwd(), configFile);
    if (configFile.endsWith('.json')) {
      const defBuffer = fs.readFileSync(configPath);
      config = JSON.parse(defBuffer.toString()) as Config;
    } else if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
      // Invalidate require cache to ensure fresh read
      delete require.cache[require.resolve(configPath)];
      const importedConfig = require(configPath);
      config = importedConfig.default || importedConfig;
    }
  }

  // Apply overrides if provided
  if (configOverride) {
    Object.keys(configOverride).forEach((key) => {
      const value = configOverride[key as keyof Config];
      if (value !== undefined) {
        config[key as keyof Config] = value;
      }
    });
  }

  const returnConfig = { ...defaultConfig(), ...config } as unknown as Config;
  return returnConfig;
};

export const initIntegrationObject = (handoff: Handoff): [integrationObject: IntegrationObject, configs: string[]] => {
  const configFiles: string[] = [];
  const result: IntegrationObject = {
    options: {},
    entries: {
      integration: undefined, // scss
      bundle: undefined, // js
      components: {},
    },
  };

  if (!!handoff.config.entries?.scss) {
    result.entries.integration = path.resolve(handoff.workingPath, handoff.config.entries?.scss);
  }

  if (!!handoff.config.entries?.js) {
    result.entries.bundle = path.resolve(handoff.workingPath, handoff.config.entries?.js);
  }

  if (handoff.config.entries?.components?.length) {
    const componentPaths = handoff.config.entries.components.flatMap(getComponentsForPath);

    for (const componentPath of componentPaths) {
      const resolvedComponentPath = path.resolve(handoff.workingPath, componentPath);
      const componentBaseName = path.basename(resolvedComponentPath);
      const versions = getVersionsForComponent(resolvedComponentPath);

      if (!versions.length) {
        console.warn(`No versions found for component at: ${resolvedComponentPath}`);
        continue;
      }

      const latest = getLatestVersionForComponent(versions);

      for (const componentVersion of versions) {
        const resolvedComponentVersionPath = path.resolve(resolvedComponentPath, componentVersion);
        const possibleConfigFiles = [`${componentBaseName}.json`, `${componentBaseName}.js`, `${componentBaseName}.cjs`];

        const configFileName = possibleConfigFiles.find((file) => fs.existsSync(path.resolve(resolvedComponentVersionPath, file)));

        if (!configFileName) {
          console.warn(`Missing config: ${path.resolve(resolvedComponentVersionPath, possibleConfigFiles.join(' or '))}`);
          continue;
        }

        const resolvedComponentVersionConfigPath = path.resolve(resolvedComponentVersionPath, configFileName);
        configFiles.push(resolvedComponentVersionConfigPath);

        let component: ComponentListObject;

        try {
          if (configFileName.endsWith('.json')) {
            const componentJson = fs.readFileSync(resolvedComponentVersionConfigPath, 'utf8');
            component = JSON.parse(componentJson) as ComponentListObject;
          } else {
            // Invalidate require cache to ensure fresh read
            delete require.cache[require.resolve(resolvedComponentVersionConfigPath)];
            const importedComponent = require(resolvedComponentVersionConfigPath);
            component = importedComponent.default || importedComponent;
          }
        } catch (err) {
          console.error(`Failed to read or parse config: ${resolvedComponentVersionConfigPath}`, err);
          continue;
        }

        // Use component basename as the id
        component.id = componentBaseName;

        // Resolve entry paths relative to component version directory
        if (component.entries) {
          for (const entryType in component.entries) {
            if (component.entries[entryType]) {
              component.entries[entryType] = path.resolve(resolvedComponentVersionPath, component.entries[entryType]);
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

        // Save transformer config for latest version
        if (componentVersion === latest) {
          result.options[component.id] = transformer;
        }

        // Save full component entry under its version
        result.entries.components[component.id] = {
          ...result.entries.components[component.id],
          [componentVersion]: component,
        };
      }
    }
  }

  return [result, Array.from(configFiles)];
};

/**
 * Returns a list of component directories for a given path.
 *
 * This function inspects the immediate subdirectories of the provided `searchPath`.
 * - If **any** subdirectory is **not** a valid semantic version (e.g. "header", "button"),
 *   the function assumes `searchPath` contains multiple component directories, and returns their full paths.
 * - If **all** subdirectories are valid semantic versions (e.g. "1.0.0", "2.1.3"),
 *   the function assumes `searchPath` itself is a component directory, and returns it as a single-element array.
 *
 * @param searchPath - The absolute path to check for components or versioned directories.
 * @returns An array of string paths to component directories.
 */
const getComponentsForPath = (searchPath: string): string[] => {
  // Read all entries in the given path and keep only directories
  const components = fs
    .readdirSync(searchPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  // If there's any non-semver-named directory, this is a directory full of components
  const containsComponents = components.some((name) => !semver.valid(name));

  if (containsComponents) {
    // Return full paths to each component directory
    return components.map((component) => path.join(searchPath, component));
  }

  // All subdirectories are semver versions – treat this as a single component directory
  return [searchPath];
};

const validateConfig = (config: Config): Config => {
  // TODO: Check to see if the exported folder exists before we run start
  if (!config.figma_project_id && !process.env.HANDOFF_FIGMA_PROJECT_ID) {
    // check to see if we can get this from the env
    console.error(chalk.red('Figma project id not found in config or env. Please run `handoff-app fetch` first.'));
    throw new Error('Cannot initialize configuration');
  }
  if (!config.dev_access_token && !process.env.HANDOFF_DEV_ACCESS_TOKEN) {
    // check to see if we can get this from the env
    console.error(chalk.red('Dev access token not found in config or env. Please run `handoff-app fetch` first.'));
    throw new Error('Cannot initialize configuration');
  }
  return config;
};

const getVersionsForComponent = (componentPath: string): string[] => {
  const versionDirectories = fs.readdirSync(componentPath);
  const versions: string[] = [];
  // The directory name must be a semver
  if (fs.lstatSync(componentPath).isDirectory()) {
    // this is a directory structure.  this should be the component name,
    // and each directory inside should be a version
    for (const versionDirectory of versionDirectories) {
      if (semver.valid(versionDirectory)) {
        const versionFiles = fs.readdirSync(path.resolve(componentPath, versionDirectory));
        for (const versionFile of versionFiles) {
          if (versionFile.endsWith('.hbs')) {
            versions.push(versionDirectory);
            break;
          }
        }
      } else {
        console.error(`Invalid version directory ${versionDirectory}`);
      }
    }
  }
  versions.sort(semver.rcompare);
  return versions;
};

const getLatestVersionForComponent = (versions: string[]): string => versions.sort(semver.rcompare)[0];

const toLowerCaseKeysAndValues = (obj: Record<string, any>): Record<string, any> => {
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

export type { ComponentListObject as Component } from './transformers/preview/types';
export type { Config } from './types/config';

export default Handoff;
