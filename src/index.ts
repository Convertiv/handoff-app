import { defaultConfig } from './config';
import { Config, IntegrationObject } from './types/config';
import fs from 'fs-extra';
import path from 'path';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { TransformedPreviewComponents } from './transformers/preview/types';
import { HookReturn } from './types';
import buildApp, { devApp, watchApp } from './app';
import pipeline, { buildIntegrationOnly, buildRecipe, buildSnippets } from './pipeline';
import { ejectConfig, ejectExportables, makeIntegration, ejectPages, ejectTheme } from './cli/eject';
import { makeExportable, makePage, makeSnippet, makeTemplate } from './cli/make';
import { HandoffIntegration, instantiateIntegration } from './transformers/integration';
import { TransformerOutput } from './transformers/types';
import chalk from 'chalk';
import { prepareIntegrationObject } from './utils/integration';
import { processSnippet, renameSnippet } from './transformers/preview';

class Handoff {
  config: Config | null;
  debug: boolean = false;
  force: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = process.cwd();
  exportsDirectory: string = 'exported';
  sitesDirectory: string = 'out';
  integrationObject: IntegrationObject | null;
  integrationHooks: HandoffIntegration;
  designMap: {
    colors: {},
    effects: {},
    typography: {}
  };
  hooks: {
    init: (config: Config) => Config;
    fetch: () => void;
    build: (documentationObject: DocumentationObject) => void;
    integration: (documentationObject: DocumentationObject, data: HookReturn[]) => HookReturn[];
    typeTransformer: (documentationObject: DocumentationObject, types: TransformerOutput) => TransformerOutput;
    cssTransformer: (documentationObject: DocumentationObject, css: TransformerOutput) => TransformerOutput;
    scssTransformer: (documentationObject: DocumentationObject, scss: TransformerOutput) => TransformerOutput;
    styleDictionaryTransformer: (documentationObject: DocumentationObject, styleDictionary: TransformerOutput) => TransformerOutput;
    mapTransformer: (documentationObject: DocumentationObject, styleDictionary: TransformerOutput) => TransformerOutput;
    webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
    preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
  };

  constructor(config?: Config) {
    this.config = null;
    this.hooks = {
      init: (config: Config): Config => config,
      fetch: () => {},
      build: (documentationObject) => {},
      typeTransformer: (documentationObject, types) => types,
      integration: (documentationObject, data: HookReturn[]) => data,
      cssTransformer: (documentationObject, css) => css,
      scssTransformer: (documentationObject, scss) => scss,
      styleDictionaryTransformer: (documentationObject, styleDictionary) => styleDictionary,
      mapTransformer: (documentationObject, styleDictionary) => styleDictionary,
      webpack: (webpackConfig) => webpackConfig,
      preview: (webpackConfig, preview) => preview,
    };
    this.init(config);
    this.integrationHooks = instantiateIntegration(this);
    global.handoff = this;
  }
  init(configOverride?: Config): Handoff {
    const config = initConfig(configOverride ?? {});
    this.config = config;
    this.config = this.hooks.init(this.config);
    this.exportsDirectory = config.exportsOutputDirectory ?? this.exportsDirectory;
    this.sitesDirectory = config.sitesOutputDirectory ?? this.exportsDirectory;
    this.integrationObject = initIntegrationObject(this.workingPath);
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
    if (this.config) {
      this.preRunner();
      await pipeline(this);
      this.hooks.fetch();
    }
    return this;
  }
  async recipe(): Promise<Handoff> {
    this.preRunner();
    if (this.config) {
      await buildRecipe(this);
    }
    return this;
  }
  async snippet(name: string | null): Promise<Handoff> {
    this.preRunner();
    if (this.config) {
      if (name) {
        // Get snippet path
        name = name.includes('.html') ? name : `${name}.html`;
        const snippetPath = path.resolve(this.workingPath, 'integration/snippets', name);
        await processSnippet(this, snippetPath);
      } else {
        await buildSnippets(this);
      }
    }
    return this;
  }
  async renameSnippet(oldName: string, target: string): Promise<Handoff> {
    this.preRunner();
    if (this.config) {
      renameSnippet(this, oldName, target);
    }
    return this;
  }
  async integration(): Promise<Handoff> {
    this.preRunner();
    if (this.config) {
      await buildIntegrationOnly(this);
    }
    return this;
  }
  async build(): Promise<Handoff> {
    this.preRunner(true);
    if (this.config) {
      await buildApp(this);
    }
    return this;
  }
  async ejectConfig(): Promise<Handoff> {
    this.preRunner();
    if (this.config) {
      await ejectConfig(this);
    }
    return this;
  }
  async ejectIntegration(): Promise<Handoff> {
    if (this.config) {
      await makeIntegration(this);
    }
    return this;
  }
  async ejectExportables(): Promise<Handoff> {
    if (this.config) {
      await ejectExportables(this);
    }
    return this;
  }
  async ejectPages(): Promise<Handoff> {
    if (this.config) {
      await ejectPages(this);
    }
    return this;
  }
  async ejectTheme(): Promise<Handoff> {
    if (this.config) {
      await ejectTheme(this);
    }
    return this;
  }
  async makeExportable(type: string, name: string): Promise<Handoff> {
    if (this.config) {
      await makeExportable(this, type, name);
    }
    return this;
  }
  async makeTemplate(component: string, state: string): Promise<Handoff> {
    if (this.config) {
      await makeTemplate(this, component, state);
    }
    return this;
  }
  async makePage(name: string, parent: string): Promise<Handoff> {
    if (this.config) {
      await makePage(this, name, parent);
    }
    return this;
  }
  async makeSnippet(name: string): Promise<Handoff> {
    if (this.config) {
      await makeSnippet(this, name);
    }
    return this;
  }
  async makeIntegration(): Promise<Handoff> {
    if (this.config) {
      await makeIntegration(this);
    }
    return this;
  }
  async start(): Promise<Handoff> {
    if (this.config) {
      this.preRunner(true);
      await watchApp(this);
    }
    return this;
  }
  async dev(): Promise<Handoff> {
    if (this.config) {
      this.preRunner(true);
      await devApp(this);
    }
    return this;
  }
  postInit(callback: (config: Config) => Config) {
    this.hooks.init = callback;
  }
  postTypeTransformer(callback: (documentationObject: DocumentationObject, types: TransformerOutput) => TransformerOutput) {
    this.hooks.typeTransformer = callback;
  }
  postCssTransformer(callback: (documentationObject: DocumentationObject, types: TransformerOutput) => TransformerOutput) {
    this.hooks.cssTransformer = callback;
  }
  postScssTransformer(callback: (documentationObject: DocumentationObject, types: TransformerOutput) => TransformerOutput) {
    this.hooks.scssTransformer = callback;
  }
  postPreview(
    callback: (documentationObject: DocumentationObject, previews: TransformedPreviewComponents) => TransformedPreviewComponents
  ) {
    this.hooks.preview = callback;
  }
  postBuild(callback: (documentationObject: DocumentationObject) => void) {
    this.hooks.build = callback;
  }
  postIntegration(callback: (documentationObject: DocumentationObject, data: HookReturn[]) => HookReturn[]) {
    this.hooks.integration = callback;
  }
  modifyWebpackConfig(callback: (webpackConfig: webpack.Configuration) => webpack.Configuration) {
    this.hooks.webpack = callback;
  }
}

const initConfig = (configOverride?: any): Config => {
  let config = {};
  let configPath = path.resolve(process.cwd(), 'handoff.config.json');

  if (fs.existsSync(configPath)) {
    const defBuffer = fs.readFileSync(configPath);
    config = JSON.parse(defBuffer.toString()) as Config;
  }

  if (configOverride) {
    config = { ...config, ...configOverride };
  }
  const returnConfig = { ...defaultConfig(), ...config } as unknown as Config;
  return returnConfig;
};


export const initIntegrationObject = (workingPath: string): IntegrationObject => {
  const integrationPath = path.join(workingPath, 'integration');

  if (!fs.existsSync(integrationPath)) {
    return null;
  }

  const integrationConfigPath = path.resolve(path.join(workingPath, 'integration', 'integration.config.json'));

  if (!fs.existsSync(integrationConfigPath)) {
    return null;
  }

  const buffer = fs.readFileSync(integrationConfigPath);
  const integration = JSON.parse(buffer.toString()) as IntegrationObject;

  return prepareIntegrationObject(integration, integrationPath);
};

const validateConfig = (config: Config): Config => {
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
export default Handoff;
