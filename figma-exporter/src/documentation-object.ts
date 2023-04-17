import assetsExporter from './exporters/assets';
import getFileComponentTokens from './exporters/components';
import getFileDesignTokens from './exporters/design';
import { DocumentationObject } from './types';
import { startCase } from 'lodash';
import chalk from 'chalk';

export const createDocumentationObject = async (figmaFileKey: string, figmaAccessToken: string): Promise<DocumentationObject> => {
  const components = await getFileComponentTokens(figmaFileKey, figmaAccessToken);
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
