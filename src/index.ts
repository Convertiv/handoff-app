import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { getConfig, getHandoff, serializeHandoff } from './config';
import { Config } from './types/config';
import { maskPrompt } from './utils/prompt';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { filterOutNull } from './utils/index';
import 'dotenv/config';
import * as stream from 'node:stream';
import { getRequestCount } from './figma/api';
import webpack from 'webpack';
import {
  DocumentationObject,
  ExportableDefinition,
  ExportableOptions,
  ExportableSharedOptions,
  ExportableTransformerOptions,
} from './types';
import merge from 'lodash/merge';
import { ExportableTransformerOptionsMap } from './transformers/types';
import { createDocumentationObject } from './documentation-object';
import { zipAssets } from './api';
import scssTransformer, { scssTypesTransformer } from './transformers/scss/index';
import cssTransformer, { CssTransformerOutput } from './transformers/css/index';
import integrationTransformer from './transformers/integration/index';
import fontTransformer from './transformers/font/index';
import previewTransformer, { TransformedPreviewComponents } from './transformers/preview/index';
import { buildClientFiles } from './utils/preview';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { type } from 'os';
import { HookReturn } from './types/plugin';
import buildApp, { exportNext, watchApp } from './app';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

let config;
const outputFolder = process.env.OUTPUT_DIR || 'exported';
const exportablesFolder = 'config/exportables';
const tokensFilePath = path.join(outputFolder, 'tokens.json');
const previewFilePath = path.join(outputFolder, 'preview.json');
const changelogFilePath = path.join(outputFolder, 'changelog.json');
const variablesFilePath = path.join(outputFolder, 'tokens');
const iconsZipFilePath = path.join(outputFolder, 'icons.zip');
const logosZipFilePath = path.join(outputFolder, 'logos.zip');

/**
 * Read Previous Json File
 * @param path
 * @returns
 */
const readPrevJSONFile = async (path: string) => {
  try {
    return await fs.readJSON(path);
  } catch (e) {
    return undefined;
  }
};

const formatComponentsTransformerOptions = (exportables: ExportableDefinition[]): ExportableTransformerOptionsMap => {
  return new Map<string, ExportableTransformerOptions & ExportableSharedOptions>(
    Object.entries(
      exportables.reduce((res, exportable) => {
        return { ...res, ...{ [exportable.id]: { ...exportable.options.transformer, ...exportable.options.shared } } };
      }, {})
    )
  );
};

const getExportables = async (handoff: Handoff) => {
  try {
    if (!handoff.config) {
      throw new Error('Handoff config not found');
    }
    const config = handoff.config;
    const definitions = config?.figma?.definitions;
    if (!definitions || definitions.length === 0) {
      return [];
    }

    const exportables = definitions
      .map((def) => {
        let defPath = path.resolve(path.join(handoff.modulePath, exportablesFolder, `${def}.json`));
        const projectPath = path.resolve(path.join(handoff.workingPath, exportablesFolder, `${def}.json`));
        // If the project path exists, use that first as an override
        if (fs.existsSync(projectPath)) {
          defPath = projectPath;
        } else if (!fs.existsSync(defPath)) {
          return null;
        }

        const defBuffer = fs.readFileSync(defPath);
        const exportable = JSON.parse(defBuffer.toString()) as ExportableDefinition;

        const exportableOptions = {};
        merge(exportableOptions, config?.figma?.options, exportable.options);
        exportable.options = exportableOptions as ExportableOptions;

        return exportable;
      })
      .filter(filterOutNull);

    return exportables ? exportables : [];
  } catch (e) {
    return [];
  }
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildCustomFonts = async (documentationObject: DocumentationObject) => {
  return await fontTransformer(documentationObject);
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildIntegration = async (documentationObject: DocumentationObject) => {
  const handoff = getHandoff();
  const integration = await integrationTransformer(documentationObject);
  handoff.hooks.integration(documentationObject);
  return integration;
};

/**
 * Run just the preview
 * @param documentationObject
 */
const buildPreview = async (documentationObject: DocumentationObject) => {
  if (Object.keys(documentationObject.components).filter((name) => documentationObject.components[name].length > 0).length > 0) {
    await Promise.all([previewTransformer(documentationObject).then((out) => fs.writeJSON(previewFilePath, out, { spaces: 2 }))]);
    await buildClientFiles()
      .then((value) => console.log(chalk.green(value)))
      .catch((error) => {
        throw new Error(error);
      });
  } else {
    console.log(chalk.red('Skipping preview generation'));
  }
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async (documentationObject: DocumentationObject, options: ExportableTransformerOptionsMap) => {
  let typeFiles = scssTypesTransformer(documentationObject, options);
  // typeFiles = (await pluginTransformer()).postTypeTransformer(documentationObject, typeFiles);
  let cssFiles = cssTransformer(documentationObject, options);
  // cssFiles = (await pluginTransformer()).postTypeTransformer(documentationObject, cssFiles);
  let scssFiles = scssTransformer(documentationObject, options);
  // scssFiles = (await pluginTransformer()).postTypeTransformer(documentationObject, scssFiles);
  await Promise.all([
    fs
      .ensureDir(variablesFilePath)
      .then(() => fs.ensureDir(`${variablesFilePath}/types`))
      .then(() => fs.ensureDir(`${variablesFilePath}/css`))
      .then(() => fs.ensureDir(`${variablesFilePath}/sass`))
      .then(() =>
        Promise.all(
          Object.entries(typeFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath}/types/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(typeFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath}/types/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath}/css/${name}.css`, content))
        )
      )
      .then(() =>
        Promise.all(Object.entries(cssFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath}/css/${name}.css`, content)))
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath}/sass/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath}/sass/${name}.scss`, content))
        )
      ),
  ]);
};

/**
 * Run the entire pipeline
 */
const pipeline = async (handoff: Handoff) => {
  if (!handoff.config) {
    throw new Error('Handoff config not found');
  }
  let DEV_ACCESS_TOKEN = process.env.DEV_ACCESS_TOKEN;
  let FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;
  console.log(chalk.green(`Starting Handoff Figma data pipeline. Checking for environment and config.\n`));
  // TODO: rename to something more meaningful
  if (!DEV_ACCESS_TOKEN) {
    console.log(
      chalk.yellow(`- Developer access token not found. You can supply it in an ENV or .env file at DEV_ACCESS_TOKEN.
Please enter your developer access token.\n`)
    );
    DEV_ACCESS_TOKEN = await maskPrompt(chalk.green('Figma Developer Key: '));
  }
  handoff.config.dev_access_token = DEV_ACCESS_TOKEN;

  // TODO: rename to something more meaningful
  if (!FIGMA_PROJECT_ID) {
    console.log(
      chalk.yellow(`Figma project id not found. You can supply it in an ENV or .env file at FIGMA_PROJECT_ID.
Please enter your Figma Project Id.\n`)
    );
    FIGMA_PROJECT_ID = await maskPrompt(chalk.green('Figma Project Id: '));
  }
  handoff.config.dev_access_token = FIGMA_PROJECT_ID;

  let prevDocumentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(changelogFilePath)) || [];
  await fs.emptyDir(outputFolder);
  const exportables = await getExportables(handoff);
  const componentTransformerOptions = formatComponentsTransformerOptions(exportables);
  const documentationObject = await createDocumentationObject(FIGMA_PROJECT_ID, DEV_ACCESS_TOKEN, exportables);
  const changelogRecord = generateChangelogRecord(prevDocumentationObject, documentationObject);
  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }

  await Promise.all([
    fs.writeJSON(tokensFilePath, documentationObject, { spaces: 2 }),
    fs.writeJSON(changelogFilePath, changelog, { spaces: 2 }),
    ...(!process.env.CREATE_ASSETS_ZIP_FILES || process.env.CREATE_ASSETS_ZIP_FILES !== 'false'
      ? [
          zipAssets(documentationObject.assets.icons, fs.createWriteStream(iconsZipFilePath)).then((writeStream) =>
            stream.promises.finished(writeStream)
          ),
          zipAssets(documentationObject.assets.logos, fs.createWriteStream(logosZipFilePath)).then((writeStream) =>
            stream.promises.finished(writeStream)
          ),
        ]
      : []),
  ]);
  await buildCustomFonts(documentationObject);
  await buildStyles(documentationObject, componentTransformerOptions);
  await buildIntegration(documentationObject);
  if (handoff.config.buildApp) {
    await buildPreview(documentationObject);
    await buildApp(handoff);
  } else {
    console.log(chalk.red('Skipping app generation'));
  }
  // (await pluginTransformer()).postBuild(documentationObject);
  console.log(chalk.green(`Figma pipeline complete:`, `${getRequestCount()} requests`));
};

global.handoff = null;

class Handoff {
  config: Config | null;
  debug: boolean = false;
  modulePath: string = path.resolve(__filename, '../..');
  workingPath: string = process.cwd();
  hooks: {
    init: () => void;
    fetch: () => void;
    build: (documentationObject: DocumentationObject) => void;
    integration: (documentationObject: DocumentationObject) => void;
    typeTransformer: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput;
    cssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => CssTransformerOutput;
    scssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => CssTransformerOutput;
    webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
    preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
  };

  constructor() {
    this.config = null;
    this.hooks = {
      init: () => {},
      fetch: () => {},
      build: (documentationObject) => {},
      typeTransformer: (documentationObject, types) => types,
      integration: (documentationObject) => {},
      cssTransformer: (documentationObject, css) => css,
      scssTransformer: (documentationObject, scss) => scss,
      webpack: (webpackConfig) => webpackConfig,
      preview: (webpackConfig, preview) => preview,
    };
    global.handoff = this;
  }
  async init(): Promise<Handoff> {
    this.config = await getConfig();
    serializeHandoff();
    return this;
  }
  async fetch(): Promise<Handoff> {
    if (this.config) {
      await pipeline(this);
    }
    return this;
  }
  async build(): Promise<Handoff> {
    if (this.config) {
      await buildApp(this);
    }
    return this;
  }
  async export(): Promise<Handoff> {
    if (this.config) {
      await exportNext(this);
    }
    return this;
  }
  async start(): Promise<Handoff> {
    if (this.config) {
      await watchApp(this);
    }
    return this;
  }
  postInit(callback: () => Promise<void>) {
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
  postIntegration(callback: (documentationObject: DocumentationObject) => HookReturn[]) {
    this.hooks.integration = callback;
  }
  modifyWebpackConfig(callback: (webpackConfig: webpack.Configuration) => webpack.Configuration) {
    this.hooks.webpack = callback;
  }
}

export default Handoff;
