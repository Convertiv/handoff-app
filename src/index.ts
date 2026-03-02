import 'dotenv/config';
import fs from 'fs-extra';
import { Types as CoreTypes, Handoff as HandoffRunner, Providers } from 'handoff-core';
import path from 'path';
import buildApp, { devApp, watchApp } from './app-builder';
import { ejectConfig, ejectPages, ejectTheme } from './cli/eject';
import { makeComponent, makePage, makeTemplate } from './cli/make';
import { initConfig, initRuntimeConfig, validateConfig } from './config';
import pipeline, { buildComponents } from './pipeline';
import processComponents, { ComponentSegment } from './transformers/preview/component/builder';
import { Config, RuntimeConfig } from './types/config';
import { Logger } from './utils/logger';
import { generateFilesystemSafeId } from './utils/path';

class Handoff {
  config: Config | null;
  debug: boolean = false;
  force: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = process.cwd();
  exportsDirectory: string = 'exported';
  sitesDirectory: string = 'out';
  runtimeConfig?: RuntimeConfig | null;
  designMap: {
    colors: {};
    effects: {};
    typography: {};
  };

  private _initialArgs: { debug?: boolean; force?: boolean; config?: Partial<Config> } = {};
  private _configFilePaths: string[] = [];
  private _documentationObjectCache?: CoreTypes.IDocumentationObject;
  private _handoffRunner?: ReturnType<typeof HandoffRunner> | null;

  constructor(debug?: boolean, force?: boolean, config?: Partial<Config>) {
    this._initialArgs = { debug, force, config };
    this.construct(debug, force, config);
  }

  private construct(debug?: boolean, force?: boolean, config?: Partial<Config>) {
    this.config = null;
    this.debug = debug ?? false;
    this.force = force ?? false;
    Logger.init({ debug: this.debug });
    this.init(config);
    global.handoff = this;
  }

  init(configOverride?: Partial<Config>): Handoff {
    const config = initConfig(configOverride ?? {});
    this.config = config;
    this.exportsDirectory = config.exportsOutputDirectory ?? this.exportsDirectory;
    this.sitesDirectory = config.sitesOutputDirectory ?? this.exportsDirectory;
    [this.runtimeConfig, this._configFilePaths] = initRuntimeConfig(this);
    if (this.config.app.base_path && !process.env.HANDOFF_APP_BASE_PATH) {
      process.env.HANDOFF_APP_BASE_PATH = this.config.app.base_path ?? '';
    }
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

  async build(skipComponents?: boolean, options?: { copyOnlyPaths?: string[]; deployDir?: string }): Promise<Handoff> {
    this.preRunner();
    await buildApp(this, skipComponents, options);
    return this;
  }

  async ejectConfig(): Promise<Handoff> {
    this.preRunner();
    await ejectConfig(this);
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

  async validateComponents(skipBuild?: boolean): Promise<Handoff> {
    this.preRunner();
    if (!skipBuild) {
      await processComponents(this, undefined, ComponentSegment.Validation);
    }
    return this;
  }

  /**
   * Retrieves the documentation object, using cached version if available
   * @returns {Promise<CoreTypes.IDocumentationObject | undefined>} The documentation object or undefined if not found
   */
  async getDocumentationObject(): Promise<CoreTypes.IDocumentationObject | undefined> {
    if (this._documentationObjectCache) {
      return this._documentationObjectCache;
    }
    const documentationObject = await this.readJsonFile(this.getTokensFilePath());
    this._documentationObjectCache = documentationObject;
    return documentationObject;
  }

  async getRunner(): Promise<ReturnType<typeof HandoffRunner>> {
    if (!!this._handoffRunner) {
      return this._handoffRunner;
    }

    const apiCredentials = {
      projectId: this.config.figma_project_id,
      accessToken: this.config.dev_access_token,
    };

    // Initialize the provider
    const provider = Providers.RestApiProvider(apiCredentials);

    this._handoffRunner = HandoffRunner(
      provider,
      {
        options: {
          transformer: this.runtimeConfig.options,
        },
      },
      {
        log: (msg: string): void => {
          Logger.log(msg);
        },
        err: (msg: string): void => {
          Logger.error(msg);
        },
        warn: (msg: string): void => {
          Logger.warn(msg);
        },
        success: (msg: string): void => {
          Logger.success(msg);
        },
      }
    );

    return this._handoffRunner;
  }

  /**
   * Gets the project ID, falling back to filesystem-safe working path if figma_project_id is missing
   * @returns {string} The project ID to use for path construction
   */
  getProjectId(): string {
    if (this.config?.figma_project_id) {
      return this.config.figma_project_id;
    }
    // Fallback to filesystem-safe transformation of working path
    return generateFilesystemSafeId(this.workingPath);
  }

  /**
   * Gets the output path for the current project
   * @returns {string} The absolute path to the output directory
   */
  getOutputPath(): string {
    return path.resolve(this.workingPath, this.exportsDirectory, this.getProjectId());
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

export type { ComponentObject as Component } from './transformers/preview/types';
export type { Config } from './types/config';

// Export transformers and types from handoff-core
export { Transformers as CoreTransformers, TransformerUtils as CoreTransformerUtils, Types as CoreTypes } from 'handoff-core';

export default Handoff;
