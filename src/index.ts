import { defaultConfig } from './config';
import { Config } from './types/config';
import fs from 'fs-extra';
import path from 'path';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { TransformedPreviewComponents } from './transformers/preview/types';
import { HookReturn } from './types';
import buildApp, { devApp, watchApp } from './app';
import pipeline, { buildIntegrationOnly } from './pipeline';
import { ejectConfig, ejectExportables, ejectIntegration, ejectPages, ejectTheme } from './cli/eject';
import { makeExportable, makePage, makeTemplate } from './cli/make';
import { HandoffIntegration, instantiateIntegration } from './transformers/integration';
import { TransformerOutput } from './transformers/types';

class Handoff {
  config: Config | null;
  debug: boolean = false;
  force: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = process.cwd();
  outputDirectory: string = 'exported';
  integrationHooks: HandoffIntegration;
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
    configureExportables: (exportables: string[]) => string[];
  };

  constructor(config?: Config) {
    this.config = null;
    this.outputDirectory = process.env.OUTPUT_DIR ?? this.outputDirectory;
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
      configureExportables: (exportables) => exportables,
    };
    this.init(config);
    this.integrationHooks = instantiateIntegration(this);
    global.handoff = this;
  }
  init(configOverride?: Config): Handoff {
    const config = initConfig(configOverride ?? {});
    this.config = config;
    this.config = this.hooks.init(this.config);
    return this;
  }
  preRunner(): Handoff {
    if (!this.config) {
      throw Error('Handoff not initialized');
    }
    this.config.figma.definitions = this.hooks.configureExportables(this.config.figma?.definitions || []);
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
  async integration(): Promise<Handoff> {
    this.preRunner();
    if (this.config) {
      await buildIntegrationOnly(this);
    }
    return this;
  }
  async build(): Promise<Handoff> {
    this.preRunner();
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
      await ejectIntegration(this);
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
  async start(): Promise<Handoff> {
    if (this.config) {
      this.preRunner();
      await watchApp(this);
    }
    return this;
  }
  async dev(): Promise<Handoff> {
    if (this.config) {
      this.preRunner();
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
  configureExportables(callback: (exportables: string[]) => string[]) {
    this.hooks.configureExportables = callback;
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

  return { ...defaultConfig(), ...config } as unknown as Config;
};

export default Handoff;
