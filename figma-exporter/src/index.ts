import 'dotenv/config';
import path from 'path';
import * as fs from 'fs-extra';
import * as stream from 'node:stream';

import { DocumentationObject } from './types';
import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { createDocumentationObject } from './documentation-object';
import { zipAssets } from './exporters/assets';
import scssTransformer, { scssVariantsTransformer } from './transformers/scss';
import previewTransformer from './transformers/preview';
import { buildClientFiles } from './utils/preview';
import cssTransformer from './transformers/css';
import chalk from 'chalk';
import { getRequestCount } from './figma/api';
import fontTransformer from './transformers/font';
import integrationTransformer from './transformers/integration';

const outputFolder = process.env.OUTPUT_DIR || 'exported';
const tokensFilePath = path.join(outputFolder, 'tokens.json');
const previewFilePath = path.join(outputFolder, 'preview.json');
const changelogFilePath = path.join(outputFolder, 'changelog.json');
const variablesFilePath = path.join(outputFolder, 'variables');
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

/**
 * Read the current configuration
 * @param path
 * @returns
 */
const readConfigFile = async (path: string) => {
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
const buildCustomFonts = async (documentationObject: DocumentationObject) => {
  return await fontTransformer(documentationObject);
}

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildIntegration = async (documentationObject: DocumentationObject) => {
  return await integrationTransformer();
}

/**
 * Run just the preview
 * @param documentationObject
 */
const buildPreview = async (documentationObject: DocumentationObject) => {
  if (Object.keys(documentationObject.components).filter((name) => documentationObject.components[name].length > 0).length > 0) {
    await Promise.all([
      previewTransformer(documentationObject).then((out) => fs.writeJSON(previewFilePath, out, { spaces: 2 })),
      buildClientFiles(),
    ]);
  } else {
    console.log(chalk.red('Skipping preview generation'));
  }
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async (documentationObject: DocumentationObject) => {
  const variantFiles = scssVariantsTransformer(documentationObject);
  const cssFiles = cssTransformer(documentationObject);
  const scssFiles = scssTransformer(documentationObject);
  await Promise.all([
    fs
      .ensureDir(variablesFilePath)
      .then(() => fs.ensureDir(`${variablesFilePath}/variants`))
      .then(() => fs.ensureDir(`${variablesFilePath}/css`))
      .then(() => fs.ensureDir(`${variablesFilePath}/sass`))
      .then(() =>
        Promise.all(
          Object.entries(variantFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath}/variants/${name}.scss`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath}/css/${name}.css`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.components).map(([name, content]) => fs.writeFile(`${variablesFilePath}/sass/${name}.scss`, content))
        )
      ),
  ]);
};
/**
 * Run the entire pipeline
 */
const entirePipeline = async () => {
  const DEV_ACCESS_TOKEN = process.env.DEV_ACCESS_TOKEN;
  const FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;

  // TODO: rename to something more meaningful
  if (!DEV_ACCESS_TOKEN) {
    throw new Error('Missing "DEV_ACCESS_TOKEN" env variable.');
  }

  // TODO: rename to something more meaningful
  if (!FIGMA_PROJECT_ID) {
    throw new Error('Missing "FIGMA_PROJECT_ID" env variable.');
  }

  let prevDocumentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(changelogFilePath)) || [];

  await fs.emptyDir(outputFolder);

  const documentationObject = await createDocumentationObject(FIGMA_PROJECT_ID, DEV_ACCESS_TOKEN);
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
  await buildStyles(documentationObject);
  await buildIntegration(documentationObject);
  await buildPreview(documentationObject);
  console.log(chalk.green(`Figma pipeline complete:`, `${getRequestCount()} requests`))
};

// Check to see what options have been passed and
(async function () {
  if (process.argv.length === 2) {
    await entirePipeline();
  }
  if (process.argv.length === 3) {
    if (process.argv[2] === 'preview') {
      let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
      if (documentationObject) {
        await buildPreview(documentationObject);
        await buildIntegration(documentationObject);
      } else {
        console.log(chalk.red('Cannot run preview only because tokens do not exist. Run the fetch first.'));
      }
    } else if (process.argv[2] === 'integration') {
      let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
      if (documentationObject) {
        await buildStyles(documentationObject);
        await buildPreview(documentationObject);
        await buildIntegration(documentationObject);
      } else {
        console.log(chalk.red('Cannot run preview only because tokens do not exist. Run the fetch first.'));
      }
    }
    else if (process.argv[2] === 'styles') {
      let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
      if (documentationObject) {
        await buildStyles(documentationObject);
      } else {
        console.log(chalk.red('Cannot run styles only because tokens do not exist. Run the fetch first.'));
      }
    }
    else if (process.argv[2] === 'fonts') {
      let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
      if (documentationObject) {
        await buildCustomFonts(documentationObject);
      } else {
        console.log(chalk.red('Cannot run styles only because tokens do not exist. Run the fetch first.'));
      }
    }
  }
})();
