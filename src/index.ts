import { getConfig, serializeHandoff } from './config';
import { Config } from './types/config';
import path from 'path';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { CssTransformerOutput } from './transformers/css/index';
import { TransformedPreviewComponents } from './transformers/preview/index';
import { HookReturn } from './types/plugin';
import buildApp, { exportNext, watchApp } from './app';
import pipeline, { buildIntegrationOnly } from './pipeline';
import { ejectConfig, ejectExportables, ejectIntegration, ejectPages } from './cli/eject';
import { makeExportable } from './cli/make';
import { HandoffIntegration, instantiateIntegration } from './transformers/integration';

global.handoff = null;

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
    typeTransformer: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput;
    cssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => CssTransformerOutput;
    scssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => CssTransformerOutput;
    webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
    preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
    configureExportables: (exportables: string[]) => string[];
  };

  constructor() {
    this.config = null;
    this.hooks = {
      init: (config: Config): Config => config,
      fetch: () => {},
      build: (documentationObject) => {},
      typeTransformer: (documentationObject, types) => types,
      integration: (documentationObject, data: HookReturn[]) => data,
      cssTransformer: (documentationObject, css) => css,
      scssTransformer: (documentationObject, scss) => scss,
      webpack: (webpackConfig) => webpackConfig,
      preview: (webpackConfig, preview) => preview,
      configureExportables: (exportables) => exportables,
    };
    this.init();
    this.integrationHooks = instantiateIntegration(this);
    global.handoff = this;
  }
  init(): Handoff {
    const config = getConfig();
    config.figma.definitions = this.hooks.configureExportables(config.figma?.definitions || []);
    this.config = config;
    this.config = this.hooks.init(this.config);
    serializeHandoff(this);
    return this;
  }
  async fetch(): Promise<Handoff> {
    if (this.config) {
      await pipeline(this);
      this.hooks.fetch();
    }
    return this;
  }
  async integration(): Promise<Handoff> {
    if (this.config) {
      await buildIntegrationOnly(this);
    }
    return this;
  }
  async build(): Promise<Handoff> {
    if (this.config) {
      await buildApp(this);
    }
    return this;
  }
  async exportApp(): Promise<Handoff> {
    if (this.config) {
      await exportNext(this);
    }
    return this;
  }
  async ejectConfig(): Promise<Handoff> {
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
      await watchApp(this);
    }
    return this;
  }
  postInit(callback: (config: Config) => Config) {
    this.hooks.init = callback;
  }
  postTypeTransformer(callback: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput) {
    this.hooks.typeTransformer = callback;
  }
  postCssTransformer(callback: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput) {
    this.hooks.cssTransformer = callback;
  }
  postScssTransformer(callback: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput) {
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
