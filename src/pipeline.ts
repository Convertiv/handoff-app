import chalk from 'chalk';
import 'dotenv/config';
import fs from 'fs-extra';
import { merge } from 'lodash';
import * as stream from 'node:stream';
import path from 'path';
import Handoff from '.';
import { zipAssets } from './api';
import buildApp from './app';
import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { createDocumentationObject } from './documentation-object';
import { getRequestCount } from './figma/api';
import cssTransformer from './transformers/css/index';
import fontTransformer from './transformers/font/index';
import mapTransformer from './transformers/map';
import { componentTransformer } from './transformers/preview/component';
import scssTransformer, { scssTypesTransformer } from './transformers/scss/index';
import sdTransformer from './transformers/sd';
import { DocumentationObject, LegacyComponentDefinition, LegacyComponentDefinitionOptions } from './types';
import { filterOutNull } from './utils';
import { findFilesByExtension } from './utils/fs';
import { maskPrompt, prompt } from './utils/prompt';

/**
 * Read Previous Json File
 * @param path
 * @returns
 */
export const readPrevJSONFile = async (path: string) => {
  try {
    return await fs.readJSON(path);
  } catch (e) {
    return undefined;
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
 * Build previews
 * @param documentationObject
 * @returns
 */
export const buildComponents = async (handoff: Handoff) => {
  await Promise.all([componentTransformer(handoff)]);
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  const typeFiles = scssTypesTransformer(documentationObject, handoff.integrationObject);
  const cssFiles = cssTransformer(documentationObject, handoff, handoff.integrationObject);
  const scssFiles = scssTransformer(documentationObject, handoff, handoff.integrationObject);
  const sdFiles = sdTransformer(documentationObject, handoff, handoff.integrationObject);
  const mapFiles = mapTransformer(documentationObject, handoff.integrationObject);

  await Promise.all([
    fs
      .ensureDir(handoff.getVariablesFilePath())
      .then(() => fs.ensureDir(`${handoff.getVariablesFilePath()}/types`))
      .then(() => fs.ensureDir(`${handoff.getVariablesFilePath()}/css`))
      .then(() => fs.ensureDir(`${handoff.getVariablesFilePath()}/sass`))
      .then(() => fs.ensureDir(`${handoff.getVariablesFilePath()}/sd/tokens`))
      .then(() => fs.ensureDir(`${handoff.getVariablesFilePath()}/maps`))
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.components).map(([name, _]) => fs.ensureDir(`${handoff.getVariablesFilePath()}/sd/tokens/${name}`))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(typeFiles.components).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/types/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(typeFiles.design).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/types/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.components).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/css/${name}.css`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.design).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/css/${name}.css`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.components).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/sass/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.design).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/sass/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.components).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/sd/tokens/${name}/${name}.tokens.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.design).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/sd/tokens/${name}.tokens.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(mapFiles.components).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/maps/${name}.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(mapFiles.design).map(([name, content]) =>
            fs.writeFile(`${handoff.getVariablesFilePath()}/maps/${name}.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(mapFiles.attachments).map(([name, content]) => fs.writeFile(`${handoff.getOutputPath()}/${name}.json`, content))
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

/**
 * Validate the figma auth tokens
 * @param handoff
 */
const validateFigmaAuth = async (handoff: Handoff): Promise<void> => {
  let DEV_ACCESS_TOKEN = handoff.config.dev_access_token;
  let FIGMA_PROJECT_ID = handoff.config.figma_project_id;

  if (DEV_ACCESS_TOKEN && FIGMA_PROJECT_ID) {
    return;
  }

  let missingEnvVars = false;

  if (!DEV_ACCESS_TOKEN) {
    missingEnvVars = true;
    console.log(
      chalk.yellow(`Figma developer access token not found. You can supply it as an environment variable or .env file at HANDOFF_DEV_ACCESS_TOKEN.
Use these instructions to generate them ${chalk.blue(
        `https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens`
      )}\n`)
    );
    DEV_ACCESS_TOKEN = await maskPrompt(chalk.green('Figma Developer Key: '));
  }

  if (!FIGMA_PROJECT_ID) {
    missingEnvVars = true;
    console.log(
      chalk.yellow(`\n\nFigma project id not found. You can supply it as an environment variable or .env file at HANDOFF_FIGMA_PROJECT_ID.
You can find this by looking at the url of your Figma file. If the url is ${chalk.blue(
        `https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D`
      )}
your id would be IGYfyraLDa0BpVXkxHY2tE\n`)
    );
    FIGMA_PROJECT_ID = await maskPrompt(chalk.green('Figma Project Id: '));
  }

  if (missingEnvVars) {
    console.log(
      chalk.yellow(
        `\n\nYou supplied at least one required variable. We can write these variables to a local env file for you to make it easier to run the pipeline in the future.\n`
      )
    );

    const writeEnvFile = await prompt(chalk.green('Write environment variables to .env file? (y/n): '));

    if (writeEnvFile !== 'y') {
      console.log(chalk.green(`Skipping .env file creation. You will need to supply these variables in the future.\n`));
    } else {
      const envFilePath = path.resolve(handoff.workingPath, '.env');
      const envFileContent = `
HANDOFF_DEV_ACCESS_TOKEN="${DEV_ACCESS_TOKEN}"
HANDOFF_FIGMA_PROJECT_ID="${FIGMA_PROJECT_ID}"
`;

      try {
        const fileExists = await fs
          .access(envFilePath)
          .then(() => true)
          .catch(() => false);

        if (fileExists) {
          await fs.appendFile(envFilePath, envFileContent);
          console.log(
            chalk.green(
              `\nThe .env file was found and updated with new content. Since these are sensitive variables, please do not commit this file.\n`
            )
          );
        } else {
          await fs.writeFile(envFilePath, envFileContent.replace(/^\s*[\r\n]/gm, ''));
          console.log(
            chalk.green(
              `\nAn .env file was created in the root of your project. Since these are sensitive variables, please do not commit this file.\n`
            )
          );
        }
      } catch (error) {
        console.error(chalk.red('Error handling the .env file:', error));
      }
    }
  }

  handoff.config.dev_access_token = DEV_ACCESS_TOKEN;
  handoff.config.figma_project_id = FIGMA_PROJECT_ID;
};

const figmaExtract = async (handoff: Handoff): Promise<DocumentationObject> => {
  console.log(chalk.green(`Starting Figma data extraction.`));

  let prevDocumentationObject = await handoff.getDocumentationObject();
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(handoff.getChangelogFilePath())) || [];

  await fs.emptyDir(handoff.getOutputPath());

  const legacyDefinitions = await getLegacyDefinitions(handoff);
  const documentationObject = await createDocumentationObject(handoff, legacyDefinitions);
  const changelogRecord = generateChangelogRecord(prevDocumentationObject, documentationObject);

  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }

  await Promise.all([
    fs.writeJSON(handoff.getTokensFilePath(), documentationObject, { spaces: 2 }),
    fs.writeJSON(handoff.getChangelogFilePath(), changelog, { spaces: 2 }),
    ...(!process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES || process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES !== 'false'
      ? [
          zipAssets(documentationObject.assets.icons, fs.createWriteStream(handoff.getIconsZipFilePath())).then((writeStream) =>
            stream.promises.finished(writeStream)
          ),
          zipAssets(documentationObject.assets.logos, fs.createWriteStream(handoff.getLogosZipFilePath())).then((writeStream) =>
            stream.promises.finished(writeStream)
          ),
        ]
      : []),
  ]);

  // define the output folder
  const outputFolder = path.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public');

  // ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }

  // copy assets to output folder
  fs.copyFileSync(
    handoff.getIconsZipFilePath(),
    path.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'icons.zip')
  );

  fs.copyFileSync(
    handoff.getLogosZipFilePath(),
    path.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'logos.zip')
  );

  return documentationObject;
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
  await validateFigmaAuth(handoff);
  const documentationObject = await figmaExtract(handoff);
  await buildCustomFonts(handoff, documentationObject);
  await buildStyles(handoff, documentationObject);
  // await buildComponents(handoff);
  if (build) {
    await buildApp(handoff);
  }
  // (await pluginTransformer()).postBuild(documentationObject);
  console.log(chalk.green(`Figma pipeline complete:`, `${getRequestCount()} requests`));
};
export default pipeline;

/**
 * Returns configured legacy component definitions in array form.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getLegacyDefinitions = async (handoff: Handoff): Promise<LegacyComponentDefinition[] | null> => {
  try {
    const sourcePath = path.resolve(handoff.workingPath, 'exportables');

    if (!fs.existsSync(sourcePath)) {
      return null;
    }

    const definitionPaths = findFilesByExtension(sourcePath, '.json');

    const exportables = definitionPaths
      .map((definitionPath) => {
        const defBuffer = fs.readFileSync(definitionPath);
        const exportable = JSON.parse(defBuffer.toString()) as LegacyComponentDefinition;

        const exportableOptions = {};
        merge(exportableOptions, exportable.options);
        exportable.options = exportableOptions as LegacyComponentDefinitionOptions;

        return exportable;
      })
      .filter(filterOutNull);

    return exportables ? exportables : null;
  } catch (e) {
    return [];
  }
};
