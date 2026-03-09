import * as p from '@clack/prompts';
import fs from 'fs-extra';
import { Types as HandoffTypes } from 'handoff-core';
import * as stream from 'node:stream';
import path from 'path';
import Handoff from '..';
import { Logger } from '../utils/logger';
import { zipAssets } from './archive';
import { createDocumentationObject } from './documentation';

/**
 * Validate the figma auth tokens.
 * Prompts the user interactively if credentials are missing.
 */
export const validateFigmaAuth = async (handoff: Handoff): Promise<void> => {
  let DEV_ACCESS_TOKEN = handoff.config.dev_access_token;
  let FIGMA_PROJECT_ID = handoff.config.figma_project_id;

  if (DEV_ACCESS_TOKEN && FIGMA_PROJECT_ID) {
    return;
  }

  let missingEnvVars = false;

  if (!DEV_ACCESS_TOKEN) {
    missingEnvVars = true;
    p.log.warn(
      `Figma developer access token not found. You can supply it as an environment variable or .env file at HANDOFF_DEV_ACCESS_TOKEN.\n` +
      `Use these instructions to generate them: https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens`
    );
    const token = await p.password({
      message: 'Figma Developer Key:',
    });
    if (p.isCancel(token)) {
      p.cancel('Authentication cancelled.');
      process.exit(0);
    }
    DEV_ACCESS_TOKEN = token as string;
  }

  if (!FIGMA_PROJECT_ID) {
    missingEnvVars = true;
    p.log.warn(
      `Figma project ID not found. Provide HANDOFF_FIGMA_PROJECT_ID via environment variable or .env file.\n` +
      `Find it in your Figma file URL (e.g., figma.com/file/{PROJECT_ID}/...).`
    );
    const projectId = await p.text({
      message: 'Figma Project Id:',
      validate: (value) => {
        if (!value.trim()) return 'Project ID is required';
      },
    });
    if (p.isCancel(projectId)) {
      p.cancel('Authentication cancelled.');
      process.exit(0);
    }
    FIGMA_PROJECT_ID = projectId as string;
  }

  if (missingEnvVars) {
    p.log.info(`To simplify future runs, we can save these variables to a local .env file.`);

    const writeEnvFile = await p.confirm({
      message: 'Write environment variables to .env file?',
      initialValue: true,
    });

    if (p.isCancel(writeEnvFile) || writeEnvFile === false) {
      p.log.info(`Skipped .env file creation. Please provide these variables manually.`);
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
          p.log.success(
            `The .env file was found and updated with new content. Since these are sensitive variables, please do not commit this file.`
          );
        } else {
          await fs.writeFile(envFilePath, envFileContent.replace(/^\s*[\r\n]/gm, ''));
          p.log.success(`Created .env file. Do not commit sensitive variables.`);
        }
      } catch (error) {
        Logger.error('Error handling the .env file:', error);
      }
    }
  }

  handoff.config.dev_access_token = DEV_ACCESS_TOKEN;
  handoff.config.figma_project_id = FIGMA_PROJECT_ID;
};

/**
 * Extracts data from Figma, writes tokens, zips assets, and copies outputs.
 */
export const figmaExtract = async (handoff: Handoff): Promise<HandoffTypes.IDocumentationObject> => {
  Logger.success(`Starting Figma data extraction.`);

  await fs.emptyDir(handoff.getOutputPath());

  const documentationObject = await createDocumentationObject(handoff);

  await Promise.all([
    fs.writeJSON(handoff.getTokensFilePath(), documentationObject, { spaces: 2 }),
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
