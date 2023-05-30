import 'dotenv/config';
import path from 'path';
import * as fs from 'fs-extra';
import * as stream from 'node:stream';

import { DocumentationObject, ExportableDefinition, ExportableIndex, ExportableOptions, ExportableSharedOptions, ExportableTransformerOptions } from './types';
import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { createDocumentationObject } from './documentation-object';
import { zipAssets } from './exporters/assets';
import scssTransformer, { scssTypesTransformer } from './transformers/scss';
import previewTransformer from './transformers/preview';
import { buildClientFiles } from './utils/preview';
import cssTransformer from './transformers/css';
import chalk from 'chalk';
import { getRequestCount } from './figma/api';
import fontTransformer from './transformers/font';
import integrationTransformer from './transformers/integration';
import { filterOutNull } from './utils';
import { getFetchConfig } from './utils/config';
import { ExportableTransformerOptionsMap } from './transformers/types';
import { merge } from 'lodash';
import { pluginTransformer } from './transformers/plugin';
import { Config } from './config';

const outputFolder = process.env.OUTPUT_DIR || 'exported';
const exportablesFolder = process.env.OUTPUT_DIR || 'exportables';
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

const getExportables = async () => {
  try {
    const config: Config = getFetchConfig();
    const definitions = config?.figma?.definitions;

    if (!definitions || definitions.length === 0) {
      return [];
    }

    const exportables = definitions
      .map((def) => {
        const defPath = path.resolve(path.join(__dirname, '../..', exportablesFolder, `${def}.json`));

        if (!fs.existsSync(defPath)) {
          return null;
        }

        const defBuffer = fs.readFileSync(defPath);
        const exportable = JSON.parse(defBuffer.toString()) as ExportableDefinition;

        const exportableOptions = {};
        merge(exportableOptions, config?.figma?.options, exportable.options);
        exportable.options = exportableOptions as ExportableOptions;

        return exportable;
      })
      .filter(filterOutNull)

    return exportables ? exportables : [];
  } catch (e) {
    return [];
  }
}

const formatComponentsTransformerOptions = (exportables: ExportableDefinition[]): ExportableTransformerOptionsMap => {
  return new Map<string, ExportableTransformerOptions & ExportableSharedOptions>(Object.entries(exportables.reduce((res, exportable) => {
    return { ...res, ...{ [exportable.id]: {...exportable.options.transformer, ...exportable.options.shared} } }
  }, {})));
}

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
  return await integrationTransformer(documentationObject);
};
/**
 * Run just the preview
 * @param documentationObject
 */
const buildPreview = async (documentationObject: DocumentationObject) => {
  if (Object.keys(documentationObject.components).filter((name) => documentationObject.components[name].length > 0).length > 0) {
    await Promise.all([
      previewTransformer(documentationObject).then((out) => fs.writeJSON(previewFilePath, out, { spaces: 2 })),
    ]);
    await buildClientFiles()
      .then((value) => console.log(chalk.green(value)))
      .catch((error) => { throw new Error(error) });
  } else {
    console.log(chalk.red('Skipping preview generation'));
  }
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async (documentationObject: DocumentationObject, options: ExportableTransformerOptionsMap) => {
  const typeFiles = scssTypesTransformer(documentationObject, options);
  const cssFiles = cssTransformer(documentationObject, options);
  const scssFiles = scssTransformer(documentationObject, options);
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
  (await pluginTransformer()).init();
  let prevDocumentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(changelogFilePath)) || [];

  await fs.emptyDir(outputFolder);

  const exportables = await getExportables();
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
  await buildPreview(documentationObject);
  console.log(chalk.green(`Figma pipeline complete:`, `${getRequestCount()} requests`));
};

// Check to see what options have been passed and
(async function () {
  try {
    if (process.argv.length === 2 || (process.argv.length === 3 && process.argv.indexOf('--debug') > 0)) {
      await entirePipeline();
    }
    if (process.argv.length === 3) {
      if (process.argv.indexOf('preview') > 0) {
        let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildPreview(documentationObject);
          await buildIntegration(documentationObject);
        } else {
          throw Error('Cannot run preview only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('integration') > 0) {
        let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          const exportables = await getExportables();
          const componentTransformerOptions = formatComponentsTransformerOptions(exportables);
          await buildStyles(documentationObject, componentTransformerOptions);
          await buildPreview(documentationObject);
          await buildIntegration(documentationObject);
        } else {
          throw Error('Cannot run preview only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('styles') > 0) {
        let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          const exportables = await getExportables();
          const componentTransformerOptions = formatComponentsTransformerOptions(exportables);
          await buildStyles(documentationObject, componentTransformerOptions);
        } else {
          throw Error('Cannot run styles only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('fonts') > 0) {
        let documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildCustomFonts(documentationObject);
        } else {
          throw Error('Cannot run styles only because tokens do not exist. Run the fetch first.');
        }
      }
    }
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    console.error(chalk.red(message));
    if (process.argv.indexOf('--debug') > 0) {
      throw error;
    } else {
      console.log(chalk.red('The fetch pipeline was halted because of an error. \n - To debug this error, rerun it with `-- --debug`'));
    }
  }
})();
