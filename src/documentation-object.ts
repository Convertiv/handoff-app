import assetsExporter from './exporters/assets';
import { getFigmaFileComponents } from './exporters/components/index';
import { getFigmaFileDesignTokens } from './exporters/design';
import { ColorObject, DocumentationObject, EffectObject, LegacyComponentDefinition, NodeStyleMap, TypographyObject } from './types';
import startCase from 'lodash/startCase';
import chalk from 'chalk';
import Handoff from '.';

export const createDocumentationObject = async (handoff: Handoff, legacyDefinitions?: LegacyComponentDefinition[]): Promise<DocumentationObject> => {
  const design = await getFigmaFileDesignTokens(handoff.config.figma_project_id, handoff.config.dev_access_token);
  const icons = await assetsExporter(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Icons');
  const logos = await assetsExporter(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Logo');

  /// create a design map of node ids and references
  handoff.designMap = {
    colors: design.color.reduce((acc: NodeStyleMap, color: ColorObject) => {
      acc[color.id] = color.reference;
      return acc;
    }, {}),
    effects: design.effect.reduce((acc: NodeStyleMap, effect: EffectObject) => {
      acc[effect.id] = effect.reference;
      return acc;
    }, {}),
    typography: design.typography.reduce((acc: NodeStyleMap, typo: TypographyObject) => {
      acc[typo.id] = typo.reference;
      return acc;
    }, {}),
  };
  const components = await getFigmaFileComponents(handoff, legacyDefinitions);
  
  // Log out components
  Object.keys(components).map((component: string) => {
    if (components[component].instances.length === 0) {
      console.error(chalk.grey(`Skipping "${startCase(component)}". Reason: No matching component instances were found.`));
    } else {
      console.log(chalk.green(`${startCase(component)} exported:`), components[component].instances.length);
    }
  });

  
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
