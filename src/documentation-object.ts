import assetsExporter from './exporters/assets.js';
import { getFigmaFileComponents } from './exporters/components/index.js';
import { getFigmaFileDesignTokens } from './exporters/design.js';
import { DocumentationObject, LegacyComponentDefinition } from './types.js';
import startCase from 'lodash/startCase.js';
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
