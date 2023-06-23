import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { getHandoff, serializeHandoff } from './config';
import { maskPrompt, prompt } from './utils/prompt';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { filterOutNull } from './utils/index';
import 'dotenv/config';
import * as stream from 'node:stream';
import { getRequestCount } from './figma/api';
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
import cssTransformer from './transformers/css/index';
import integrationTransformer from './transformers/integration/index';
import fontTransformer from './transformers/font/index';
import previewTransformer from './transformers/preview/index';
import { buildClientFiles } from './utils/preview';
import buildApp from './app';
import Handoff from '.';

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

/**
 * Get the exportables from the config
 * @param handoff
 * @returns Promise<ExportableDefinition[]>
 */
const getExportables = async (handoff: Handoff): Promise<ExportableDefinition[]> => {
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
        const projectPath = path.resolve(path.join(handoff.workingPath, 'exportables', `${def}.json`));
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
  const handoff = getHandoff();
  let typeFiles = scssTypesTransformer(documentationObject, options);
  typeFiles = handoff.hooks.typeTransformer(documentationObject, typeFiles);
  let cssFiles = cssTransformer(documentationObject, options);
  cssFiles = handoff.hooks.cssTransformer(documentationObject, cssFiles);
  let scssFiles = scssTransformer(documentationObject, options);
  scssFiles = handoff.hooks.scssTransformer(documentationObject, scssFiles);
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

const validateHandoffRequirements = async (handoff: Handoff) => {
  let requirements = false;
  const result = process.versions;
  if (result && result.node) {
    if (parseInt(result.node) >= 16) {
      requirements = true;
    }
  } else {
    // couldn't find the right version, but ...
  }
  if (!requirements) {
    console.log(chalk.redBright('Handoff Installation failed'));
    console.log(
      chalk.yellow(
        '- Please update node to at least Node 16 https://nodejs.org/en/download. \n- You can read more about installing handoff at https://www.handoff.com/docs/'
      )
    );
    throw new Error('Could not run handoff');
  }
};

interface FigmaAuthConfig {
  dev_access_token: string;
  figma_project_id: string;
}

/**
 * Validate the figma auth tokens
 * @param handoff
 */
const validateFigmaAuth = async (handoff: Handoff): Promise<FigmaAuthConfig> => {
  let DEV_ACCESS_TOKEN = process.env.DEV_ACCESS_TOKEN;
  let FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;
  let missingEnvVars = false;
  // TODO: rename to something more meaningful
  if (!DEV_ACCESS_TOKEN) {
    missingEnvVars = true;
    console.log(
      chalk.yellow(`\nFigma developer access token not found. You can supply it as an environment variable or .env file at DEV_ACCESS_TOKEN.
Use these instructions to generate them ${chalk.blue(
        `https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens`
      )}\n`)
    );
    DEV_ACCESS_TOKEN = await maskPrompt(chalk.green('Figma Developer Key: '));
  }

  // TODO: rename to something more meaningful
  if (!FIGMA_PROJECT_ID) {
    missingEnvVars = true;
    console.log(
      chalk.yellow(`Figma project id not found. You can supply it as an environment variable or .env file at FIGMA_PROJECT_ID.
You can find this by looking at the url of your Figma file. If the url is ${chalk.blue(
        `https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D`
      )}
your id would be IGYfyraLDa0BpVXkxHY2tE\n`)
    );
    FIGMA_PROJECT_ID = await maskPrompt(chalk.green('Figma Project Id: '));
  }
  if (missingEnvVars) {
    console.log(
      chalk.yellow(`\nAt least one required environment variable was not supplied. We can write these variables to a local env 
file for you to make it easier to run the pipeline in the future.\n`)
    );
    const writeEnvFile = await prompt(chalk.green('Write environment variables to .env file? (y/n): '));
    if (writeEnvFile !== 'y') {
      console.log(chalk.green(`Skipping .env file creation. You will need to supply these variables in the future.\n`));
    } else {
      const envFile = `
DEV_ACCESS_TOKEN="${DEV_ACCESS_TOKEN}"
FIGMA_PROJECT_ID="${FIGMA_PROJECT_ID}"
`;
      await fs.writeFile(path.resolve(handoff.workingPath, '.env'), envFile);
      console.log(
        chalk.green(
          `\nAn .env file was created in the root of your project. Since these are sensitive variables, please do not commit this file.\n`
        )
      );
    }
  }
  return {
    dev_access_token: DEV_ACCESS_TOKEN,
    figma_project_id: FIGMA_PROJECT_ID,
  };
};

const figmaExtract = async (
  handoff: Handoff,
  figmaConfig: FigmaAuthConfig,
  exportables: ExportableDefinition[]
): Promise<DocumentationObject> => {
  console.log(chalk.green(`Starting Figma data extraction.`));
  let prevDocumentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(changelogFilePath)) || [];
  await fs.emptyDir(outputFolder);
  const documentationObject = await createDocumentationObject(figmaConfig.figma_project_id, figmaConfig.dev_access_token, exportables);
  const changelogRecord = generateChangelogRecord(prevDocumentationObject, documentationObject);
  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }
  handoff.hooks.build(documentationObject);
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
  return documentationObject;
};

/**
 * Build only integrations and previews
 * @param handoff
 */
export const buildIntegrationOnly = async (handoff: Handoff) => {
  let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
  if (documentationObject) {
    await buildIntegration(documentationObject);
    await buildPreview(documentationObject);
  }
};

/**
 * Run the entire pipeline
 */
const pipeline = async (handoff: Handoff, build?: boolean) => {
  if (!handoff.config) {
    throw new Error('Handoff config not found');
  }
  console.log(chalk.green(`Starting Handoff Figma data pipeline. Checking for environment and config.\n`));
  await validateHandoffRequirements(handoff);
  const figmaConfig = await validateFigmaAuth(handoff);
  const exportables = await getExportables(handoff);
  const documentationObject = await figmaExtract(handoff, figmaConfig, exportables);
  const componentTransformerOptions = formatComponentsTransformerOptions(exportables);
  await buildCustomFonts(documentationObject);
  await buildStyles(documentationObject, componentTransformerOptions);
  await buildIntegration(documentationObject);
  await buildPreview(documentationObject);
  await serializeHandoff(handoff);
  if (build) {
    await buildApp(handoff);
  }
  // (await pluginTransformer()).postBuild(documentationObject);
  console.log(chalk.green(`Figma pipeline complete:`, `${getRequestCount()} requests`));
};
export default pipeline;
