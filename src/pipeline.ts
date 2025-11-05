import archiver from 'archiver';
import chalk from 'chalk';
import 'dotenv/config';
import fs from 'fs-extra';
import { Types as HandoffTypes, Transformers } from 'handoff-core';
import { sortedUniq } from 'lodash';
import * as stream from 'node:stream';
import path from 'path';
import Handoff from '.';
import buildApp from './app';
import generateChangelogRecord, { ChangelogRecord } from './changelog';
import { createDocumentationObject } from './documentation-object';
import { componentTransformer } from './transformers/preview/component';
import { FontFamily } from './types/font';
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
 * Zips the contents of a directory and writes the resulting archive to a writable stream.
 *
 * @param dirPath - The path to the directory whose contents will be zipped.
 * @param destination - A writable stream where the zip archive will be written.
 * @returns A Promise that resolves with the destination stream when the archive has been finalized.
 * @throws Will throw an error if the archiving process fails.
 */
const zip = async (dirPath: string, destination: stream.Writable): Promise<stream.Writable> => {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Set up event handlers
    archive.on('error', reject);
    destination.on('error', reject);

    // When the destination closes, resolve the promise
    destination.on('close', () => resolve(destination));

    archive.pipe(destination);

    fs.readdir(dirPath)
      .then((fontDir) => {
        for (const file of fontDir) {
          const filePath = path.join(dirPath, file);
          archive.append(fs.createReadStream(filePath), { name: path.basename(file) });
        }
        return archive.finalize();
      })
      .catch(reject);
  });
};

export const zipAssets = async (assets: HandoffTypes.IAssetObject[], destination: stream.Writable) => {
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(destination);

  assets.forEach((asset) => {
    archive.append(asset.data, { name: asset.path });
  });

  await archive.finalize();

  return destination;
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildCustomFonts = async (handoff: Handoff, documentationObject: HandoffTypes.IDocumentationObject) => {
  const { localStyles } = documentationObject;
  const fontLocation = path.join(handoff?.workingPath, 'fonts');
  const families: FontFamily = localStyles.typography.reduce((result, current) => {
    return {
      ...result,
      [current.values.fontFamily]: result[current.values.fontFamily]
        ? // sorts and returns unique font weights
          sortedUniq([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
        : [current.values.fontWeight],
    };
  }, {} as FontFamily);

  Object.keys(families).map(async (key) => {
    const name = key.replace(/\s/g, '');
    const fontDirName = path.join(fontLocation, name);
    if (fs.existsSync(fontDirName)) {
      const stream = fs.createWriteStream(path.join(fontLocation, `${name}.zip`));
      await zip(fontDirName, stream);
      const fontsFolder = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId(), 'fonts');
      if (!fs.existsSync(fontsFolder)) {
        fs.mkdirSync(fontsFolder);
      }
      fs.copySync(fontDirName, fontsFolder);
    }
  });
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
const buildStyles = async (handoff: Handoff, documentationObject: HandoffTypes.IDocumentationObject) => {
  // Core transformers that should always be included
  const coreTransformers = [
    {
      transformer: Transformers.ScssTransformer,
      outDir: 'sass',
      format: 'scss',
    },
    {
      transformer: Transformers.ScssTypesTransformer,
      outDir: 'types',
      format: 'scss',
    },
    {
      transformer: Transformers.CssTransformer,
      outDir: 'css',
      format: 'css',
    },
  ];

  // Get user-configured transformers
  const userTransformers = handoff.config?.pipeline?.transformers || [];

  // Merge core transformers with user transformers
  // If a user transformer matches a core transformer, use user's outDir and format
  const transformers = coreTransformers.map((coreTransformer) => {
    const userTransformer = userTransformers.find((t) => t.transformer === coreTransformer.transformer);
    return userTransformer ? { ...coreTransformer, outDir: userTransformer.outDir, format: userTransformer.format } : coreTransformer;
  });

  // Add any additional user transformers that aren't core transformers
  userTransformers.forEach((userTransformer) => {
    if (!coreTransformers.some((core) => core.transformer === userTransformer.transformer)) {
      transformers.push(userTransformer);
    }
  });

  const baseDir = handoff.getVariablesFilePath();
  const runner = await handoff.getRunner();

  // Create transformer instances and transform documentation object
  const transformedFiles = transformers.map(({ transformer }) => ({
    transformer,
    files: runner.transform(transformer({ useVariables: handoff.config?.useVariables }), documentationObject),
  }));

  // Ensure base directory exists
  await fs.ensureDir(baseDir);

  // Create all necessary subdirectories
  const directories = transformers.map(({ outDir }) => path.join(baseDir, outDir));
  await Promise.all(directories.map((dir) => fs.ensureDir(dir)));

  // Special case for SD tokens components directory
  const sdTransformer = transformers.find((t) => t.transformer === Transformers.StyleDictionaryTransformer);
  if (sdTransformer) {
    const sdFiles = transformedFiles.find((t) => t.transformer === Transformers.StyleDictionaryTransformer)?.files;
    if (sdFiles?.components) {
      await Promise.all(Object.keys(sdFiles.components).map((name) => fs.ensureDir(path.join(baseDir, sdTransformer.outDir, name))));
    }
  }

  // Write all files
  const writePromises = transformedFiles.flatMap(({ transformer: TransformerClass, files }) => {
    const { outDir, format } = transformers.find((t) => t.transformer === TransformerClass) || {};
    if (!outDir || !files) return [];

    const componentPromises = Object.entries(files.components || {}).map(([name, content]) => {
      const filePath =
        TransformerClass === Transformers.StyleDictionaryTransformer
          ? path.join(baseDir, outDir, name, `${name}.tokens.json`)
          : path.join(baseDir, outDir, `${name}.${format}`);
      return fs.writeFile(filePath, content);
    });

    const designPromises = Object.entries(files.design || {}).map(([name, content]) => {
      const filePath =
        TransformerClass === Transformers.StyleDictionaryTransformer
          ? path.join(baseDir, outDir, `${name}.tokens.json`)
          : path.join(baseDir, outDir, `${name}.${format}`);
      return fs.writeFile(filePath, content);
    });

    return [...componentPromises, ...designPromises];
  });

  // Generate tokens-map.json
  const mapFiles = transformedFiles.find((t) => t.transformer === Transformers.MapTransformer)?.files;
  if (mapFiles) {
    const tokensMapContent = JSON.stringify(
      Object.entries(mapFiles.components || {}).reduce(
        (acc, [_, data]) => ({
          ...acc,
          ...JSON.parse(data as string),
        }),
        {
          ...JSON.parse(mapFiles.design.colors as string),
          ...JSON.parse(mapFiles.design.typography as string),
          ...JSON.parse(mapFiles.design.effects as string),
        }
      ),
      null,
      2
    );
    writePromises.push(fs.writeFile(path.join(handoff.getOutputPath(), 'tokens-map.json'), tokensMapContent));
  }

  // Write all files
  await Promise.all(writePromises);
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

const figmaExtract = async (handoff: Handoff) => {
  console.log(chalk.green(`Starting Figma data extraction.`));

  let prevDocumentationObject = await handoff.getDocumentationObject();
  let changelog: ChangelogRecord[] = (await readPrevJSONFile(handoff.getChangelogFilePath())) || [];

  await fs.emptyDir(handoff.getOutputPath());

  const documentationObject = await createDocumentationObject(handoff);
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
  const outputFolder = path.resolve(handoff.modulePath, '.handoff', `${handoff.getProjectId()}`, 'public');

  // ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }

  // copy assets to output folder
  fs.copyFileSync(
    handoff.getIconsZipFilePath(),
    path.join(handoff.modulePath, '.handoff', `${handoff.getProjectId()}`, 'public', 'icons.zip')
  );

  fs.copyFileSync(
    handoff.getLogosZipFilePath(),
    path.join(handoff.modulePath, '.handoff', `${handoff.getProjectId()}`, 'public', 'logos.zip')
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
};
export default pipeline;
