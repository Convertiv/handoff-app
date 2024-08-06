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
  if (!handoff || !handoff?.config) {
    throw Error('Handoff not initialized');
  }
  const integrationFolder = 'config/integrations';

  const config = handoff.config;

  if (!config.integration) {
    return null;
  }

  if (config.integration.name === 'custom') {
    // Look for a custom integration
    const customPath = path.resolve(path.join(handoff.workingPath, 'integration'));

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
};

/**
 * Get the entry point for the integration
 * @returns string
 */
export const getIntegrationEntryPoint = (handoff: Handoff): string | null => {
  const integrationPath = getPathToIntegration(handoff);

  return integrationPath
    ? path.resolve(path.join(integrationPath, 'templates', 'main.js'))
    : null;
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

const renderIntegrationTemplates = async (sourcePath: string, destPath: string, documentationObject: DocumentationObject): Promise<void> => {
  const items = await fs.readdir(sourcePath);

  for (const item of items) {
      const sourceItemPath = path.join(sourcePath, item);
      const destItemPath = path.join(destPath, item);

      const stat = await fs.stat(sourceItemPath);

      if (stat.isDirectory()) {
          // Create the directory in the destination path if it doesn't exist
          await fs.ensureDir(destItemPath);
          // Recursively process the directory
          await renderIntegrationTemplates(sourceItemPath, destItemPath, documentationObject);
      } else {
          // Read the file content
          const content = await fs.readFile(sourceItemPath, 'utf-8');
          // Compile the template with Handlebars
          const template = Handlebars.compile(content);
          // Render the content with Handlebars
          const renderedContent = template({ documentationObject: documentationObject } as IntegrationTemplateContext);
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
  // define the output folder
  const outputFolder = path.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public');
  // ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
  }
  // define the integration path
  const integrationPath = getPathToIntegration(handoff);
  // copy the sass and templates to the exported folder
  const destinationPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration');
  // const sassFolder = path.resolve(handoff.workingPath, exportedFolder, `integration`);
  const templatesFolder = path.resolve(__dirname, '../../templates');
  const integrationsSass = path.resolve(integrationPath, 'sass');
  const integrationTemplates = path.resolve(integrationPath, 'templates');
  // clean destP
  // fs.removeSync(sassFolder);
  // fs.removeSync(templatesFolder);
  // fs.copySync(integrationPath, destinationDirectory);

  // console.log(integrationPath, destinationPath)co

  try {
    Handlebars.registerHelper(`value`, (componentName: string, part: string, variant: string, property: string, options: Handlebars.HelperOptions) => {
      const context = options.data.root as IntegrationTemplateContext;

      const component = context.documentationObject.components[componentName.toLocaleLowerCase()];

      if (!component) {
        return new Handlebars.SafeString("unset");
      }

      const search: [string, string][] = variant.split(',').map((pair) => {
        const [key, value] = pair.split(':');
        return [key ?? "".trim(), value ?? "".trim()];
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
        return new Handlebars.SafeString("unset");
      }

      const partTokenSets = componentInstance.parts[""] || componentInstance.parts["$"];

      if (!partTokenSets || partTokenSets.length === 0) {
        return new Handlebars.SafeString("unset");
      }

      const tokens = partTokenSets.reduce((prev, curr) => ({ ...prev, ...getTokenSetTokens(curr) }), {} as TokenDict);

      if (!tokens) {
        return new Handlebars.SafeString("unset");
      }

      const value = tokens[property];

      if (!value) {
        return new Handlebars.SafeString("unset");
      }

      if (typeof(value) === "string") {
        return new Handlebars.SafeString(value);
      }

      return new Handlebars.SafeString(value[0]);
    });

    for (const tokenType of (['css', 'scss'] as TokenType[])) {
      Handlebars.registerHelper(
        `${tokenType}-token`,
        (componentName: string, part: string, variant: string, property: string, options: Handlebars.HelperOptions) => {
          const context = options.data.root as IntegrationTemplateContext;

          const component = context.documentationObject.components[componentName.toLocaleLowerCase()];

          if (!component) {
            return new Handlebars.SafeString("unset");
          }

          const search: [string, string][] = variant.split(',').map((pair) => {
            const [key, value] = pair.split(':');
            return [key ?? "".trim(), value ?? "".trim()];
          });

          const componentInstance = component.instances.find((instance) =>
            search.every(([searchProperty, _]) => {
              return instance.variantProperties.some(
                (variantProperty) => variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase()
              );
            })
          );

          if (!componentInstance) {
            return new Handlebars.SafeString("unset");
          }

          return new Handlebars.SafeString(formatTokenName(tokenType, componentName, search, part, property, {}));
        }
      );
    };

    await renderIntegrationTemplates(integrationPath, destinationPath, documentationObject);
    console.log('Templates rendered successfully!');
  } catch (err) {
    console.error('Error rendering templates:', err);
  }

  // copy to dest
  // fs.copySync(integrationsSass, sassFolder);
  // fs.copySync(integrationTemplates, templatesFolder);
  // replace tokens with actual values
  // const mainScssFilePath = path.resolve(sassFolder, 'main.scss')
  // if (fs.existsSync(mainScssFilePath)) {

  //   fs.writeFileSync(mainScssFilePath, fs.readFileSync(mainScssFilePath, 'utf8'));

  //   fs.writeFileSync(mainScssFilePath, replaceHandoffImportTokens(
  //     handoff,
  //     fs.readFileSync(mainScssFilePath, 'utf8'),
  //     Object.keys(documentationObject.components)
  //   ));
  // }
  // // copy the exported integration into the user defined dir (if the EXPORT_PATH environment variable is defined)
  // if (process.env.HANDOFF_EXPORT_PATH) {
  //   fs.copySync(sassFolder, process.env.HANDOFF_EXPORT_PATH);
  // }


  // zip the tokens
  // const stream = fs.createWriteStream(path.join(outputFolder, `tokens.zip`));
  // await zipTokens(exportedFolder, stream);
  // let data = handoff.integrationHooks.hooks.integration(documentationObject, []);
  // data = handoff.hooks.integration(documentationObject, data);
  // if (data.length > 0) {
  //   data.map((artifact) => {
  //     fs.writeFileSync(path.join(sassFolder, artifact.filename), artifact.data);
  //   });
  // }
}

const replaceHandoffImportTokens = (handoff: Handoff, content: string, components: string[]) => {
  getHandoffImportTokens(handoff, components)
    .forEach(([token, imports]) => {
      content = content.replaceAll(`//<#${token}#>`, imports.map(path => `@import '${path}';`).join(`\r\n`))
    });

  return content;
}

const getHandoffImportTokens = (handoff: Handoff, components: string[]) => {
  const result: [token: string, imports: string[]][] = [];
  components.forEach((component) => {
    getHandoffImportTokensForComponent(handoff, component)
      .forEach(([importToken, ...searchPath], idx) => {
        result[idx] ?? result.push([importToken, []]);
        if (fs.existsSync(path.resolve(...searchPath))) {
          result[idx][1].push(`${searchPath[1]}/${component}`);
        }
      });
  });

  return result;
}

const getHandoffImportTokensForComponent = (handoff: Handoff, component: string): [token: string, root: string, path: string, file: string][] => {
  const integrationPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration');
  return [
    ['HANDOFF.TOKENS.TYPES', integrationPath, '../tokens/types', `${component}.scss`],
    ['HANDOFF.TOKENS.SASS', integrationPath, '../tokens/sass', `${component}.scss`],
    ['HANDOFF.TOKENS.CSS', integrationPath, '../tokens/css', `${component}.css`],
    ['HANDOFF.MAPS', integrationPath, 'maps', `_${component}.scss`],
    ['HANDOFF.EXTENSIONS', integrationPath, 'extended', `_${component}.scss`]
  ]
};

interface IntegrationTemplateContext {
  documentationObject: DocumentationObject;
}