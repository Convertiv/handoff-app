import { getConfig, serializeHandoff } from './config';
import { Config } from './types/config';
import path from 'path';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { TransformedPreviewComponents } from './transformers/preview/types';
import { HookReturn } from './types';
import buildApp, { devApp, watchApp } from './app';
import pipeline, { buildIntegrationOnly } from './pipeline';
import { ejectConfig, ejectExportables, ejectIntegration, ejectPages } from './cli/eject';
import { makeExportable } from './cli/make';
import { HandoffIntegration, instantiateIntegration } from './transformers/integration';
import { TransformerOutput } from './transformers/types';
var handoff = null;
declare global {
  var handoff: Handoff | null;
}
global.handoff = handoff;

class Handoff {
  config: Config | null;
  debug: boolean = false;
  force: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = process.cwd();
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
    webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
    preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
    configureExportables: (exportables: string[]) => string[];
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
      webpack: (webpackConfig) => webpackConfig,
      preview: (webpackConfig, preview) => preview,
      configureExportables: (exportables) => exportables,
    };
    this.init(config);
    this.integrationHooks = instantiateIntegration(this);
    global.handoff = this;
  }
  init(configOverride?: Config): Handoff {
    const config = getConfig(configOverride ?? {});
    this.config = config;
    this.config = this.hooks.init(this.config);
    serializeHandoff(this);
    return this;
  }
  preRunner(): Handoff {
    if(!this.config) {
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
  async makeExportable(type: string, name: string): Promise<Handoff> {
    if (this.config) {
      await makeExportable(this, type, name);
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

export default Handoff;
