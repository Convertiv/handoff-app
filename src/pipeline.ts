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
import integrationTransformer, { getPathToIntegration } from './transformers/integration/index';
import mapTransformer from './transformers/map';
import { componentTransformer } from './transformers/preview/component';
import previewTransformer from './transformers/preview/index';
import scssTransformer, { scssTypesTransformer } from './transformers/scss/index';
import sdTransformer from './transformers/sd';
import { getTokenSetNameByProperty } from './transformers/tokens';
import { DocumentationObject, LegacyComponentDefinition, LegacyComponentDefinitionOptions } from './types';
import { ComponentIntegrationRecipe, ComponentIntegrations } from './types/recipes';
import { filterOutNull, filterOutUndefined } from './utils';
import { findFilesByExtension } from './utils/fs';
import { maskPrompt, prompt } from './utils/prompt';

let config;
export const outputPath = (handoff: Handoff) =>
  path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
export const tokensFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'tokens.json');
export const previewFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'preview.json');
export const changelogFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'changelog.json');
export const variablesFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'tokens');
export const iconsZipFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'icons.zip');
export const logosZipFilePath = (handoff: Handoff) => path.join(outputPath(handoff), 'logos.zip');

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
 * Build integration
 * @param documentationObject
 * @returns
 */
const buildIntegration = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  await integrationTransformer(handoff, documentationObject);
};

/**
 * Build previews
 * @param documentationObject
 * @returns
 */
const buildPreviews = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  await Promise.all([
    previewTransformer(handoff, documentationObject).then((out) => fs.writeJSON(previewFilePath(handoff), out, { spaces: 2 })),
  ]);
};

/**
 * Build previews
 * @param documentationObject
 * @returns
 */
export const buildComponents = async (handoff: Handoff) => {
  const documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath(handoff));
  await Promise.all([componentTransformer(handoff, documentationObject.components)]);
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  let typeFiles = scssTypesTransformer(documentationObject, handoff.integrationObject);
  typeFiles = handoff.hooks.typeTransformer(documentationObject, typeFiles);
  let cssFiles = cssTransformer(documentationObject, handoff, handoff.integrationObject);
  cssFiles = handoff.hooks.cssTransformer(documentationObject, cssFiles);
  let scssFiles = scssTransformer(documentationObject, handoff, handoff.integrationObject);
  scssFiles = handoff.hooks.scssTransformer(documentationObject, scssFiles);
  let sdFiles = sdTransformer(documentationObject, handoff, handoff.integrationObject);
  sdFiles = handoff.hooks.styleDictionaryTransformer(documentationObject, sdFiles);
  let mapFiles = mapTransformer(documentationObject, handoff.integrationObject);
  mapFiles = handoff.hooks.mapTransformer(documentationObject, mapFiles);

  await Promise.all([
    fs
      .ensureDir(variablesFilePath(handoff))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/types`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/css`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/sass`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/sd/tokens`))
      .then(() => fs.ensureDir(`${variablesFilePath(handoff)}/maps`))
      .then(() =>
        Promise.all(Object.entries(sdFiles.components).map(([name, _]) => fs.ensureDir(`${variablesFilePath(handoff)}/sd/tokens/${name}`)))
      )

      .then(() =>
        Promise.all(
          Object.entries(typeFiles.components).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/types/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(typeFiles.design).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/types/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.components).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/css/${name}.css`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(cssFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/css/${name}.css`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.components).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/sass/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(scssFiles.design).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/sass/${name}.scss`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.components).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/sd/tokens/${name}/${name}.tokens.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(sdFiles.design).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/sd/tokens/${name}.tokens.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(mapFiles.components).map(([name, content]) =>
            fs.writeFile(`${variablesFilePath(handoff)}/maps/${name}.json`, content)
          )
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(mapFiles.design).map(([name, content]) => fs.writeFile(`${variablesFilePath(handoff)}/maps/${name}.json`, content))
        )
      )
      .then(() =>
        Promise.all(
          Object.entries(mapFiles.attachments).map(([name, content]) => fs.writeFile(`${outputPath(handoff)}/${name}.json`, content))
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
  let prevDocumentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath(handoff));
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(changelogFilePath(handoff))) || [];
  await fs.emptyDir(outputPath(handoff));
  const legacyDefinitions = await getLegacyDefinitions(handoff);
  const documentationObject = await createDocumentationObject(handoff, legacyDefinitions);
  const changelogRecord = generateChangelogRecord(prevDocumentationObject, documentationObject);
  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }
  handoff.hooks.build(documentationObject);
  await Promise.all([
    fs.writeJSON(tokensFilePath(handoff), documentationObject, { spaces: 2 }),
    fs.writeJSON(changelogFilePath(handoff), changelog, { spaces: 2 }),
    ...(!process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES || process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES !== 'false'
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
  // define the output folder
  const outputFolder = path.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public');
  // ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }
  // copy assets to output folder
  fs.copyFileSync(
    iconsZipFilePath(handoff),
    path.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'icons.zip')
  );
  fs.copyFileSync(
    logosZipFilePath(handoff),
    path.join(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'logos.zip')
  );
  return documentationObject;
};

export const buildRecipe = async (handoff: Handoff) => {
  const TOKEN_REGEX = /{{\s*(scss-token|css-token|value)\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)"\s+"([^"]*)"\s*}}/;

  const processToken = (content: string, records: ComponentIntegrations): void => {
    let match;
    const regex = new RegExp(TOKEN_REGEX, 'g');
    while ((match = regex.exec(content)) !== null) {
      const [_, __, component, part, variants, cssProperty] = match;

      let componentRecord = records.components.find((c) => c.name === component);
      if (!componentRecord) {
        componentRecord = { name: component, common: { parts: [] }, recipes: [] };
        records.components.push(componentRecord);
      }

      const requiredTokenSet = getTokenSetNameByProperty(cssProperty);
      const existingPartIndex = (componentRecord.common.parts ?? []).findIndex((p) => typeof p !== 'string' && p.name === part);

      if (existingPartIndex === -1) {
        componentRecord.common.parts.push({
          name: part,
          require: [getTokenSetNameByProperty(cssProperty)].filter(filterOutUndefined),
        });
      } else if (requiredTokenSet && !componentRecord.common.parts[existingPartIndex].require.includes(requiredTokenSet)) {
        componentRecord.common.parts[existingPartIndex].require = [
          ...componentRecord.common.parts[existingPartIndex].require,
          requiredTokenSet,
        ];
      }

      const variantPairs = variants.split(',').map((v) => v.split(':'));
      const variantGroup: ComponentIntegrationRecipe['require'] = { variantProps: [], variantValues: {} };

      variantPairs.forEach(([key, value]) => {
        if (!variantGroup.variantProps.includes(key)) {
          variantGroup.variantProps.push(key);
        }

        if (!variantGroup.variantValues[key]) {
          variantGroup.variantValues[key] = [];
        }

        if (/^[a-zA-Z0-9]+$/.test(value) && !variantGroup.variantValues[key].includes(value)) {
          variantGroup.variantValues[key].push(value);
        }
      });

      const existingGroupIndex = componentRecord.recipes.findIndex(
        (recipe) =>
          recipe.require.variantProps.length === variantGroup.variantProps.length &&
          recipe.require.variantProps.every((prop) => variantGroup.variantProps.includes(prop)) &&
          Object.keys(recipe.require.variantValues).every(
            (key) =>
              recipe.require.variantValues[key].length === variantGroup.variantValues[key]?.length &&
              recipe.require.variantValues[key].every((val) => variantGroup.variantValues[key].includes(val))
          )
      );

      if (existingGroupIndex === -1) {
        componentRecord.recipes.push({ require: variantGroup });
      }
    }
  };

  const traverseDirectory = (directory: string, records: ComponentIntegrations): void => {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverseDirectory(fullPath, records);
      } else if (stat.isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        processToken(content, records);
      }
    });
  };

  const integrationPath = getPathToIntegration(handoff, false);

  if (!integrationPath) {
    console.log(chalk.yellow('Unable to build integration recipe. Reason: Integration not found.'));
    return;
  }

  const directoryToTraverse = handoff?.integrationObject?.entries?.integration;
  if (!directoryToTraverse) {
    console.log(chalk.yellow('Unable to build integration recipe. Reason: Integration entry not specified.'));
    return;
  }

  const componentRecords: ComponentIntegrations = { components: [] };
  const stat = await fs.stat(directoryToTraverse);

  traverseDirectory(stat.isDirectory() ? directoryToTraverse : path.dirname(directoryToTraverse), componentRecords);

  componentRecords.components.forEach((component) => {
    component.common.parts.sort();
  });

  const writePath = path.resolve(handoff.workingPath, 'recipes.json');

  await fs.writeFile(writePath, JSON.stringify(componentRecords, null, 2));

  console.log(chalk.green(`Integration recipe has been successfully written to ${writePath}`));
};

/**
 * Build only integrations and previews
 * @param handoff
 */
export const buildIntegrationOnly = async (handoff: Handoff) => {
  const documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensFilePath(handoff));
  if (documentationObject) {
    // Ensure that the integration object is set if possible
    // handoff.integrationObject = initIntegrationObject(handoff);
    await buildIntegration(handoff, documentationObject);
    await buildPreviews(handoff, documentationObject);
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
  await validateFigmaAuth(handoff);
  const documentationObject = await figmaExtract(handoff);
  await buildCustomFonts(handoff, documentationObject);
  await buildStyles(handoff, documentationObject);
  await buildIntegration(handoff, documentationObject);
  await buildPreviews(handoff, documentationObject);
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
