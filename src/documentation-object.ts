import chalk from 'chalk';
import startCase from 'lodash/startCase';
import Handoff from '.';
import assetsExporter, { writeAssets } from './exporters/assets';
import { getFigmaFileComponents } from './exporters/components/index';
import { getFigmaFileDesignTokens } from './exporters/design';
import {
  ColorObject,
  DocumentationObject,
  EffectObject,
  LegacyComponentDefinition,
  NodeStyleMap,
  ReferenceObject,
  TypographyObject,
} from './types';

export const createDocumentationObject = async (
  handoff: Handoff,
  legacyDefinitions?: LegacyComponentDefinition[]
): Promise<DocumentationObject> => {
  const design = await getFigmaFileDesignTokens(handoff.config.figma_project_id, handoff.config.dev_access_token);
  const icons = await assetsExporter(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Icons');
  await writeAssets(handoff, icons, 'icons');
  const logos = await assetsExporter(handoff.config.figma_project_id, handoff.config.dev_access_token, 'Logo');
  await writeAssets(handoff, logos, 'logos');

  /// create a design map of node ids and references
  handoff.designMap = {
    colors: design.color.reduce((acc: NodeStyleMap, color: ColorObject) => {
      acc[color.id] = {
        reference: color.reference,
        type: 'color',
        group: color.group,
        name: color.name,
      } as ReferenceObject;

      return acc;
    }, {}),
    effects: design.effect.reduce((acc: NodeStyleMap, effect: EffectObject) => {
      acc[effect.id] = {
        reference: effect.reference,
        group: effect.group,
        name: effect.name,
        type: 'effect',
      } as ReferenceObject;
      return acc;
    }, {}),
    typography: design.typography.reduce((acc: NodeStyleMap, typo: TypographyObject) => {
      acc[typo.id] = {
        reference: typo.reference,
        type: 'typography',
        group: typo.group,
        name: typo.name,
      } as ReferenceObject;
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
