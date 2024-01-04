import assetsExporter from './exporters/assets';
import { getFigmaFileComponents } from './exporters/components/index';
import { getFigmaFileDesignTokens } from './exporters/design';
import { DocumentationObject, LegacyComponentDefinition } from './types';
import startCase from 'lodash/startCase';
import chalk from 'chalk';

export const createDocumentationObject = async (figmaFileKey: string, figmaAccessToken: string, legacyDefinitions?: LegacyComponentDefinition[]): Promise<DocumentationObject> => {
  const components = await getFigmaFileComponents(figmaFileKey, figmaAccessToken, legacyDefinitions);

  // Log out components
  Object.keys(components).map((component: string) => {
    if (components[component].instances.length === 0) {
      console.error(chalk.grey(`Skipping "${startCase(component)}". Reason: No matching component instances were found.`));
    } else {
      console.log(chalk.green(`${startCase(component)} exported:`), components[component].instances.length);
    }
  });

  const design = await getFigmaFileDesignTokens(figmaFileKey, figmaAccessToken);
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
