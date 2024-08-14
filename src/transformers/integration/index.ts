import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import * as stream from 'node:stream';
import { DocumentationObject } from '../../types';
import { TransformedPreviewComponents } from '../preview/types';
import webpack from 'webpack';
import { HookReturn } from '../../types';
import Handoff from '../../index';
import { modifyWebpackConfigForTailwind, postTailwindIntegration } from './tailwind';
import { formatTokenName } from '../utils';
import { TokenDict, TokenType } from '../types';
import { getTokenSetTokens } from '../tokens';
import chalk from 'chalk';

const defaultIntegration = 'bootstrap';
const defaultVersion = '5.3';

export class HandoffIntegration {
  name: string;
  version: string;
  hooks: {
    integration: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[];
    webpack: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration;
    preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
  };
  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
    this.hooks = {
      integration: (documentationObject, artifacts) => artifacts,
      webpack: (handoff, webpackConfig) => webpackConfig,
      preview: (webpackConfig, preview) => preview,
    };
  }
  postIntegration(callback: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[]) {
    this.hooks.integration = callback;
  }
  modifyWebpackConfig(callback: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration) {
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
 * and version.  Allow users to define custom integration if desired.
 */
export const getPathToIntegration = (handoff: Handoff): string | null => {
  if (!handoff) {
    throw Error('Handoff not initialized');
  }

  const ejectedIntegrationPath = path.resolve(path.join(handoff.workingPath, 'integration'));
  const defaultIntegrationPath = path.resolve(path.join(handoff.modulePath, 'config', 'integrations', 'bootstrap', '5.3'));

  return fs.existsSync(ejectedIntegrationPath) ? ejectedIntegrationPath : defaultIntegrationPath;
};

/**
 * Get the entry point for the integration
 * @returns string
 */
export const getIntegrationEntryPoint = (handoff: Handoff): string | null => {
  const entry = handoff?.integrationObject?.entries?.bundle;

  if (!entry) {
    return null;
  }

  const ejectedIntegrationPath = path.resolve(path.join(handoff.workingPath, 'integration'));
  const defaultIntegrationPath = path.resolve(path.join(handoff.modulePath, 'config', 'integrations', 'bootstrap', '5.3'));

  return fs.existsSync(ejectedIntegrationPath)
    ? path.resolve(path.join(ejectedIntegrationPath, entry))
    : path.resolve(path.join(defaultIntegrationPath, entry));
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

const buildIntegration = async (sourcePath: string, destPath: string, documentationObject: DocumentationObject): Promise<void> => {
  const items = await fs.readdir(sourcePath);

  for (const item of items) {
    const sourceItemPath = path.join(sourcePath, item);
    const destItemPath = path.join(destPath, item);

    const stat = await fs.stat(sourceItemPath);

    if (stat.isDirectory()) {
      // Create the directory in the destination path if it doesn't exist
      await fs.ensureDir(destItemPath);
      // Recursively process the directory
      await buildIntegration(sourceItemPath, destItemPath, documentationObject);
    } else {
      // Read the file content
      const content = await fs.readFile(sourceItemPath, 'utf-8');
      // Compile the template with Handlebars
      const template = Handlebars.compile(content);
      // Render the content with Handlebars
      const renderedContent = template({
        components: Object.keys(documentationObject.components),
        documentationObject: documentationObject,
      } as IntegrationTemplateContext);
      // Ensure the directory exists before writing the file
      await fs.ensureDir(path.dirname(destItemPath));
      // Write the rendered content to the destination path
      await fs.writeFile(destItemPath, renderedContent);
    }
  }
};

/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
export default async function integrationTransformer(handoff: Handoff, documentationObject: DocumentationObject) {
  if (!handoff?.integrationObject) {
    return;
  }

  console.log(chalk.green(`Integration build started (using: ${handoff.integrationObject.name})...`));

  const outputFolder = path.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public');

  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }

  const integrationPath = getPathToIntegration(handoff);
  const destinationPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration');
  const integrationDataPath = handoff?.integrationObject?.entries?.integration
    ? path.resolve(integrationPath, handoff.integrationObject.entries.integration)
    : null;

  if (!integrationDataPath) {
    console.log(chalk.yellow('Unable to build integration. Reason: No integration entry was specified.'));
    return;
  }

  try {
    Handlebars.registerHelper(
      `value`,
      (componentName: string, part: string, variant: string, property: string, options: Handlebars.HelperOptions) => {
        const context = options.data.root as IntegrationTemplateContext;

        const component = context.documentationObject.components[componentName.toLocaleLowerCase()];

        if (!component) {
          return new Handlebars.SafeString('unset');
        }

        const search: [string, string][] = variant.split(',').map((pair) => {
          const [key, value] = pair.split(':');
          return [key ?? ''.trim(), value ?? ''.trim()];
        });

        const componentInstance = component.instances.find((instance) =>
          search.every(([searchProperty, searchValue]) => {
            return instance.variantProperties.some(
              (variantProperty) =>
                variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase() &&
                variantProperty[1].toLocaleLowerCase() === searchValue.toLocaleLowerCase()
            );
          })
        );

        if (!componentInstance) {
          return new Handlebars.SafeString('unset');
        }

        const partTokenSets = componentInstance.parts[''] || componentInstance.parts['$'];

        if (!partTokenSets || partTokenSets.length === 0) {
          return new Handlebars.SafeString('unset');
        }

        const tokens = partTokenSets.reduce((prev, curr) => ({ ...prev, ...getTokenSetTokens(curr) }), {} as TokenDict);

        if (!tokens) {
          return new Handlebars.SafeString('unset');
        }

        const value = tokens[property];

        if (!value) {
          return new Handlebars.SafeString('unset');
        }

        if (typeof value === 'string') {
          return new Handlebars.SafeString(value);
        }

        return new Handlebars.SafeString(value[0]);
      }
    );

    for (const tokenType of ['css', 'scss'] as TokenType[]) {
      Handlebars.registerHelper(
        `${tokenType}-token`,
        (componentName: string, part: string, variant: string, property: string, options: Handlebars.HelperOptions) => {
          const context = options.data.root as IntegrationTemplateContext;

          const component = context.documentationObject.components[componentName.toLocaleLowerCase()];

          if (!component) {
            return new Handlebars.SafeString('unset');
          }

          const search: [string, string][] = variant.split(',').map((pair) => {
            const [key, value] = pair.split(':');
            return [key ?? ''.trim(), value ?? ''.trim()];
          });

          const componentInstance = component.instances.find((instance) =>
            search.every(([searchProperty, _]) => {
              return instance.variantProperties.some(
                (variantProperty) => variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase()
              );
            })
          );

          if (!componentInstance) {
            return new Handlebars.SafeString('unset');
          }

          return new Handlebars.SafeString(
            formatTokenName(tokenType, componentName, search, part, property, handoff.integrationObject.options[componentName])
          );
        }
      );
    }

    await buildIntegration(integrationDataPath, destinationPath, documentationObject);

    console.log(chalk.green('Integration build finished successfully!'));
  } catch (err) {
    console.error(chalk.red(`Unable to build integration. Reason: Error was encountered (${err})`));
  }

  // prepare relevant export paths
  const exportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
  const exportIntegrationPath = path.resolve(handoff.workingPath, exportPath, `integration`);

  // copy the exported integration into the user defined dir (if the EXPORT_PATH environment variable is defined)
  if (process.env.HANDOFF_EXPORT_PATH) {
    fs.copySync(exportIntegrationPath, process.env.HANDOFF_EXPORT_PATH);
  }

  // zip the tokens
  await zipTokens(exportPath, fs.createWriteStream(path.join(outputFolder, `tokens.zip`)));
  let data = handoff.integrationHooks.hooks.integration(documentationObject, []);
  data = handoff.hooks.integration(documentationObject, data);
  if (data.length > 0) {
    data.map((artifact) => {
      fs.writeFileSync(path.join(exportIntegrationPath, artifact.filename), artifact.data);
    });
  }
}

interface IntegrationTemplateContext {
  components: string[];
  documentationObject: DocumentationObject;
}
