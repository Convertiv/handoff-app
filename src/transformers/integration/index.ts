import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import * as stream from 'node:stream';
import { DocumentationObject } from '../../types';

import { getConfig, getHandoff } from '../../config';
import { TransformedPreviewComponents } from '../preview';
import webpack from 'webpack';
import { HookReturn } from '../../types/plugin';
import Handoff from '../../index';
import { modifyWebpackConfigForTailwind, postTailwindIntegration } from './tailwind';
const defaultIntegration = 'bootstrap';
const defaultVersion = '5.3';
export class HandoffIntegration {
  name: string;
  version: string;
  hooks: {
    integration: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[];
    webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
    preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
  };
  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
    this.hooks = {
      integration: (documentationObject, artifacts) => artifacts,
      webpack: (webpackConfig) => webpackConfig,
      preview: (webpackConfig, preview) => preview,
    };
  }
  postIntegration(callback: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[]) {
    this.hooks.integration = callback;
  }
  modifyWebpackConfig(callback: (webpackConfig: webpack.Configuration) => webpack.Configuration) {
    this.hooks.webpack = callback;
  }
  postPreview(
    callback: (documentationObject: DocumentationObject, previews: TransformedPreviewComponents) => TransformedPreviewComponents
  ) {
    this.hooks.preview = callback;
  }
}

/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
export const getPathToIntegration = () => {
  const handoff = global.handoff;
  if (!handoff || !handoff?.config) {
    throw Error('Handoff not initialized');
  }
  const integrationFolder = 'config/integrations';

  const defaultPath = path.resolve(path.join(handoff.modulePath, integrationFolder, defaultIntegration, defaultVersion));

  const config = handoff.config;
  if (config.integration) {
    if (config.integration.name === 'custom') {
      // Look for a custom integration
      const customPath = path.resolve(path.join(handoff.workingPath, integrationFolder));
      if (!fs.existsSync(customPath)) {
        throw Error(`The config is set to use a custom integration but no custom integration found at integrations/custom`);
      }
      return customPath;
    }
    const searchPath = path.resolve(path.join(handoff.modulePath, integrationFolder, config.integration.name, config.integration.version));
    if (!fs.existsSync(searchPath)) {
      throw Error(
        `The requested integration was ${config.integration.name} version ${config.integration.version} but no integration plugin with that name was found`
      );
    }
    return searchPath;
  }
  return defaultPath;
};

/**
 * Get the entry point for the integration
 * @returns string
 */
export const getIntegrationEntryPoint = (): string => {
  return path.resolve(path.join(getPathToIntegration(), 'templates', 'main.js'));
};

/**
 * Get the name of the current integration
 * @returns string
 */
export const getIntegrationName = (): string => {
  const config = getConfig();
  const defaultIntegration = 'bootstrap';
  if (config.integration) {
    if (config.integration.name) {
      return config.integration.name;
    }
  }
  return defaultIntegration;
};

export const instantiateIntegration = (handoff: Handoff): HandoffIntegration => {
  if (!handoff || !handoff?.config) {
    throw Error('Handoff not initialized');
  }
  const config = handoff.config;
  if (config.integration) {
    switch (config?.integration?.name) {
      case 'tailwind':
        const integration = new HandoffIntegration(config.integration.name, config.integration.version);
        integration.postIntegration(postTailwindIntegration);
        integration.modifyWebpackConfig(modifyWebpackConfigForTailwind);
        return integration;
      default:
        return new HandoffIntegration(config.integration.name, config.integration.version);
    }
  }
  return new HandoffIntegration(defaultIntegration, defaultVersion);
};

/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
export const addFileToZip = async (directory: string[], dirPath: string, archive: archiver.Archiver): Promise<archiver.Archiver> => {
  for (const file of directory) {
    const pathFile = path.join(dirPath, file);
    if (fs.lstatSync(pathFile).isDirectory()) {
      const recurse = await fs.readdir(pathFile);
      archive = await addFileToZip(recurse, pathFile, archive);
    } else {
      const data = fs.readFileSync(pathFile, 'utf-8');
      archive.append(data, { name: pathFile });
    }
  }
  return archive;
};


/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
export const zipTokens = async (dirPath: string, destination: stream.Writable) => {
  let archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(destination);
  const directory = await fs.readdir(dirPath);
  archive = await addFileToZip(directory, dirPath, archive);
  await archive.finalize();

  return destination;
};

/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
export default async function integrationTransformer(documentationObject: DocumentationObject) {
  const handoff = getHandoff();
  const outputFolder = path.join('public');
  const integrationPath = getPathToIntegration();
  const integrationName = getIntegrationName();
  const sassFolder = path.resolve(handoff.workingPath, `exported/${integrationName}-tokens`);
  const templatesFolder = path.resolve(__dirname, '../../templates');
  const integrationsSass = path.resolve(integrationPath, 'sass');
  const integrationTemplates = path.resolve(integrationPath, 'templates');
  fs.copySync(integrationsSass, sassFolder);
  fs.copySync(integrationTemplates, templatesFolder);
  const stream = fs.createWriteStream(path.join(outputFolder, `tokens.zip`));
  await zipTokens('exported', stream);
  let data = handoff.integrationHooks.hooks.integration(documentationObject, []);
  data = handoff.hooks.integration(documentationObject, data);
  if(data.length > 0){
    data.map((artifact) => {
      fs.writeFileSync(path.join(sassFolder, artifact.filename), artifact.data);
    });
  }
}



