import * as p from '@clack/prompts';
import fs from 'fs-extra';
import { Types as HandoffTypes } from 'handoff-core';
import * as stream from 'node:stream';
import path from 'path';
import Handoff from '..';
import { HandoffConfigError } from '../config/errors';
import { configEnvName } from '../config/resolve-env';
import type { ResolvedConfig } from '../types/config';
import { Logger } from '../utils/logger';
import { zipAssets } from './archive';
import { createDocumentationObject } from './documentation';

/** Figma values resolved at config load, with the variable names they come from. */
export type FigmaConnection = {
  projectId: string;
  accessToken: string;
  /** Unset when the config gives a literal file ID. */
  projectIdEnv?: string;
  accessTokenEnv?: string;
};

export const resolveFigmaConnection = (config: ResolvedConfig | null | undefined): FigmaConnection => {
  const figma = config?.integrations?.figma;
  return {
    projectId: figma?.projectId?.trim() || '',
    accessToken: figma?.accessToken?.trim() || '',
    projectIdEnv: configEnvName(config, 'integrations.figma.projectId'),
    accessTokenEnv: configEnvName(config, 'integrations.figma.accessToken'),
  };
};

const describeSource = (envName: string | undefined, configPath: string): string =>
  envName ? `${envName} (${configPath})` : configPath;

/** Replaces each variable that the file already sets and appends the others. */
const saveEnvValues = async (filePath: string, values: Record<string, string>): Promise<void> => {
  const lines = fs.existsSync(filePath) ? (await fs.readFile(filePath, 'utf8')).split(/\r?\n/) : [];
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}="${value}"`;
    const index = lines.findIndex((existing) => new RegExp(`^\\s*(export\\s+)?${name}\\s*=`).test(existing));
    if (index === -1) lines.push(line);
    else lines[index] = line;
  }
  await fs.writeFile(filePath, `${lines.join('\n')}\n`);
};

/**
 * Makes sure that `fetch` has a Figma file ID and access token. In a terminal, it asks for an empty
 * value and can save it to the env file of the selected profile. Without a terminal, it throws
 * `HandoffConfigError`.
 */
export const validateFigmaAuth = async (handoff: Handoff): Promise<void> => {
  const connection = resolveFigmaConnection(handoff.config);
  let { projectId, accessToken } = connection;

  if (projectId && accessToken) {
    return;
  }

  const profile = handoff.getProfile();
  if (!process.stdin.isTTY) {
    const missing = [
      !accessToken && describeSource(connection.accessTokenEnv, 'integrations.figma.accessToken'),
      !projectId && describeSource(connection.projectIdEnv, 'integrations.figma.projectId'),
    ].filter(Boolean);
    throw new HandoffConfigError(`Figma is not configured (profile "${profile ?? 'default'}"). Set ${missing.join(' and ')}.`);
  }

  if (!accessToken) {
    p.log.warn(
      `Figma access token not found. Set ${describeSource(connection.accessTokenEnv, 'integrations.figma.accessToken')}.\n` +
        `Use these instructions to generate one: https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens`
    );
    const token = await p.password({
      message: 'Figma Developer Key:',
    });
    if (p.isCancel(token)) {
      p.cancel('Authentication cancelled.');
      process.exit(0);
    }
    accessToken = (token as string).trim();
  }

  if (!projectId) {
    p.log.warn(
      `Figma project ID not found. Set ${describeSource(connection.projectIdEnv, 'integrations.figma.projectId')}.\n` +
        `Find it in your Figma file URL (e.g., figma.com/file/{PROJECT_ID}/...).`
    );
    const value = await p.text({
      message: 'Figma Project Id:',
      validate: (value) => {
        if (!value.trim()) return 'Project ID is required';
      },
    });
    if (p.isCancel(value)) {
      p.cancel('Authentication cancelled.');
      process.exit(0);
    }
    projectId = (value as string).trim();
  }

  const values: Record<string, string> = {};
  if (!connection.accessToken && connection.accessTokenEnv) values[connection.accessTokenEnv] = accessToken;
  if (!connection.projectId && connection.projectIdEnv) values[connection.projectIdEnv] = projectId;

  const envFileName = profile ? `.env.${profile}` : '.env';
  if (Object.keys(values).length) {
    const save = await p.confirm({
      message: `Save ${Object.keys(values).join(' and ')} to ${envFileName} for future runs?`,
      initialValue: true,
    });

    if (p.isCancel(save) || save === false) {
      p.log.info(`Skipped saving. Set these variables before the next run.`);
    } else {
      try {
        await saveEnvValues(path.resolve(handoff.workingPath, envFileName), values);
        const secretNote = connection.accessTokenEnv && values[connection.accessTokenEnv] ? ' It contains a secret, so do not commit it.' : '';
        p.log.success(`Saved to ${envFileName}.${secretNote}`);
      } catch (error) {
        Logger.error(`Could not save ${envFileName}:`, error);
      }
    }
  }

  handoff.config.integrations = {
    ...handoff.config.integrations,
    figma: { ...handoff.config.integrations?.figma, projectId, accessToken },
  };
};

/**
 * Extracts data from Figma, writes tokens, zips assets, and copies outputs.
 */
export const figmaExtract = async (handoff: Handoff): Promise<HandoffTypes.IDocumentationObject> => {
  Logger.success(`Starting Figma data extraction.`);

  await fs.emptyDir(handoff.getOutputPath());

  const documentationObject = await createDocumentationObject(handoff);
  const createZipFiles = process.env.HANDOFF_CREATE_ASSETS_ZIP_FILES !== 'false';

  await Promise.all([
    fs.writeJSON(handoff.getTokensFilePath(), documentationObject, { spaces: 2 }),
    ...(createZipFiles
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

  if (!createZipFiles) {
    return documentationObject;
  }

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
