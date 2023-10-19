import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { serializeHandoff } from './config';
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
import sdTransformer from './transformers/sd';

let config;
const outputPath = (handoff: Handoff) => path.resolve(handoff.workingPath, handoff.outputDirectory);
const exportablesFolder = () =>  'config/exportables';
const tokensFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'tokens.json');
const previewFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'preview.json');
const changelogFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'changelog.json');
const variablesFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'tokens');
const iconsZipFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'icons.zip');
const logosZipFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'logos.zip');

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
        let defPath = path.resolve(path.join(handoff.modulePath, exportablesFolder(), `${def}.json`));
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
const buildCustomFonts = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  return await fontTransformer(handoff, documentationObject);
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildIntegration = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  const integration = await integrationTransformer(handoff, documentationObject);
  return integration;
};

/**
 * Run just the preview
 * @param documentationObject
 */
const buildPreview = async (handoff: Handoff, documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap) => {
  await Promise.all([previewTransformer(handoff, documentationObject, options).then((out) => fs.writeJSON(previewFilePath(handoff), out, { spaces: 2 }))]);
  if (Object.keys(documentationObject.components).filter((name) => documentationObject.components[name].length > 0).length > 0) {
    await buildClientFiles(handoff)
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
const buildStyles = async (handoff: Handoff, documentationObject: DocumentationObject, options: ExportableTransformerOptionsMap) => {
  let typeFiles = scssTypesTransformer(documentationObject, options);
  typeFiles = handoff.hooks.typeTransformer(documentationObject, typeFiles);
  let cssFiles = cssTransformer(documentationObject, options);
  cssFiles = handoff.hooks.cssTransformer(documentationObject, cssFiles);
  let scssFiles = scssTransformer(documentationObject, options);
  scssFiles = handoff.hooks.scssTransformer(documentationObject, scssFiles);
  let sdFiles = sdTransformer(documentationObject, options);
  sdFiles = handoff.hooks.styleDictionaryTransformer(documentationObject, sdFiles);

  await Promise.all([
    fs
      .ensureDir(variablesFilePath(handoff))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/types`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/css`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/sass`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/sd/tokens`))
      .then(() => Promise.all(
        Object.entries(sdFiles.components).map(([name, _]) => fs.ensureDir(`${variablesFilePath(handoff)}/sd/tokens/${name}`))
      ))

      .then(() =>
        Promise.all(
          Object.entries(typeFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/types/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(typeFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/types/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/css/${name}.css`, content))
        )
      )
      .then(() =>
        Promise.all(Object.entries(cssFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/css/${name}.css`, content)))
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/sass/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/sass/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/sd/tokens/${name}/${name}.tokens.json`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/sd/tokens/${name}.tokens.json`, content))
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
  let DEV_ACCESS_TOKEN = handoff.config.dev_access_token ?? process.env.DEV_ACCESS_TOKEN;
  let FIGMA_PROJECT_ID = handoff.config.figma_project_id ?? process.env.FIGMA_PROJECT_ID;
  let missingEnvVars = false;
  // TODO: rename to something more meaningful
  if (!DEV_ACCESS_TOKEN) {
    missingEnvVars = true;
    console.log(
      chalk.yellow(`Figma developer access token not found. You can supply it as an environment variable or .env file at DEV_ACCESS_TOKEN.
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
      chalk.yellow(`\n\nFigma project id not found. You can supply it as an environment variable or .env file at FIGMA_PROJECT_ID.
You can find this by looking at the url of your Figma file. If the url is ${chalk.blue(
        `https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D`
      )}
your id would be IGYfyraLDa0BpVXkxHY2tE\n`)
    );
    FIGMA_PROJECT_ID = await maskPrompt(chalk.green('Figma Project Id: '));
  }
  if (missingEnvVars) {
    console.log(
      chalk.yellow(`\n\nYou supplied at least one required variable. We can write these variables to a local env 
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
  let prevDocumentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath(handoff));
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(changelogFilePath(handoff))) || [];
  await fs.emptyDir(outputPath(handoff));
  const documentationObject = await createDocumentationObject(figmaConfig.figma_project_id, figmaConfig.dev_access_token, exportables);
  const changelogRecord = generateChangelogRecord(prevDocumentationObject, documentationObject);
  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }
  handoff.hooks.build(documentationObject);
  await Promise.all([
    fs.writeJSON(tokensFilePath(handoff), documentationObject, { spaces: 2 }),
    fs.writeJSON(changelogFilePath(handoff), changelog, { spaces: 2 }),
    ...(!process.env.CREATE_ASSETS_ZIP_FILES || process.env.CREATE_ASSETS_ZIP_FILES !== 'false'
      ? [
          zipAssets(documentationObject.assets.icons, fs.createWriteStream(iconsZipFilePath(handoff))).then((writeStream) =>
            stream.promises.finished(writeStream)
          ),
          zipAssets(documentationObject.assets.logos, fs.createWriteStream(logosZipFilePath(handoff))).then((writeStream) =>
            stream.promises.finished(writeStream)
          ),
        ]
      : []),
  ]);
  fs.copyFileSync(iconsZipFilePath(handoff), path.join(handoff.modulePath, 'src/app/public', 'icons.zip'));
  fs.copyFileSync(logosZipFilePath(handoff), path.join(handoff.modulePath, 'src/app/public', 'logos.zip'));
  return documentationObject;
};

/**
 * Build only integrations and previews
 * @param handoff
 */
export const buildIntegrationOnly = async (handoff: Handoff) => {
  const exportables = await getExportables(handoff);
  const componentTransformerOptions = formatComponentsTransformerOptions(exportables);
  const documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath(handoff));
  if (documentationObject) {
    await buildIntegration(handoff, documentationObject);
    await buildPreview(handoff, documentationObject, componentTransformerOptions);
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
  await buildCustomFonts(handoff, documentationObject);
  await buildStyles(handoff, documentationObject, componentTransformerOptions);
  await buildIntegration(handoff, documentationObject);
  await buildPreview(handoff, documentationObject, componentTransformerOptions);
  await serializeHandoff(handoff);
  if (build) {
    await buildApp(handoff);
  }
  // (await pluginTransformer()).postBuild(documentationObject);
  console.log(chalk.green(`Figma pipeline complete:`, `${getRequestCount()} requests`));
};
export default pipeline;
