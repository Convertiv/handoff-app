import assetsExporter from './exporters/assets.js';
import getFileComponentTokens from './exporters/components/index.js';
import getFileDesignTokens from './exporters/design.js';
import { DocumentationObject, ExportableDefinition } from './types';
import startCase from 'lodash/startCase.js';
import chalk from 'chalk';

export const createDocumentationObject = async (figmaFileKey: string, figmaAccessToken: string, exportables: ExportableDefinition[]): Promise<DocumentationObject> => {
  const components = await getFileComponentTokens(figmaFileKey, figmaAccessToken, exportables);
  // Log out components
  if (Object.keys(components).filter((component: string) => components[component].length > 0).length > 0) {
    Object.keys(components).map((component: string) => {
      if (components[component].length === 0) {
        console.error(chalk.grey(`${startCase(component)} could not be located in the figma file`));
      } else {
        console.log(chalk.green(`${startCase(component)} exported:`), components[component].length);
      }
    });
  }

  const design = await getFileDesignTokens(figmaFileKey, figmaAccessToken);
  const icons = await assetsExporter(figmaFileKey, figmaAccessToken, 'Icons');
  const logos = await assetsExporter(figmaFileKey, figmaAccessToken, 'Logo');

  return {
    timestamp: new Date().toISOString(),
    design,
    components,
    assets: {
      icons,
      logos,
    },
  };
};
