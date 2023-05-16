import chalk from 'chalk';
import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import { FullComponentMetadata } from '../../figma/types';
import { filterByNodeType } from '../utils';
import { VariantProperty } from '../../types';
import { ExportableDefinition } from '../../types';

const template = {
  id: '',
  options: {
    exporter: {
      search: '',
      rootCssClass: '',
      supportedVariantProps: [],
    },
    demo: {
      tabs: {
        overview: { design: {}, layout: {} },
        designTokens: { design: {} },
      },
    },
  },
  parts: [],
};

export const scanComponentSets = async (figmaFileKey: string, figmaAccessToken: string): Promise<boolean> => {
  let fileComponentSetsRes;

  try {
    fileComponentSetsRes = await getComponentSets(figmaFileKey, figmaAccessToken);
  } catch (err) {
    throw new Error(
      'Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide'
    );
  }
  const componentSets = fileComponentSetsRes.data.meta.component_sets.map((componentSet: FullComponentMetadata) => componentSet.name);
  console.log(componentSets);

  if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
    console.error(
      chalk.red(
        'Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'
      )
    );

    console.log(chalk.blue('Continuing fetch with only colors and typography design foundations'));

    return false;
  }

  const componentSetsNodesRes = await getComponentSetNodes(
    figmaFileKey,
    fileComponentSetsRes.data.meta.component_sets.map((item) => item.node_id),
    figmaAccessToken
  );
  // Find something
  const search = 'Button';
  const find = Object.values(componentSetsNodesRes.data.nodes)
    .filter((node) => node?.document.name === search)
    .map((node) => node?.document)
    .filter(filterByNodeType('COMPONENT_SET'));

  console.log(chalk.blue(`Found ${find.length} set(s) of ${search}`));
  // Get all the instances of the component
  const structure: ExportableDefinition = {
    ...template,
  };
  find.forEach((node) => {
    const components = node.children.map((child) => child);
    const names = components.map((child) => child.name);
    console.log(chalk.blue(`Found ${components.length} components of ${node.name}`));
    console.log(chalk.blue(`Attempting to derive structure from components`));
    // Start by defining the structure from the instance names
    const variantProps = parseComponentSupportVarientProperties(names);
    console.log(chalk.blue(`Found ${variantProps.length} variant properties`), variantProps);
    structure.options.exporter.supportedVariantProps = variantProps;
    // Now we need to find the parts
    components.filter((component) => component.name === 'COMPONENT').forEach((component) => {
        // We're only looking at components, and the first level should be an instance
        
    });
  });
  return true;
};

/**
 * This is the inverse of the `getComponentSupportedVariantProperties` since it
 * takes a string value and generates the possible variants and param
 * @param definition
 * @returns
 */
function parseComponentSupportVarientProperties(names: string[]): VariantProperty[] {
  const variants: VariantProperty[] = [];
  (names ?? []).map((name) => {
    const regex = new RegExp('([^=|^,|^\\W]+)=([^,|^\\W]+)', 'gm');
    let m;
    while ((m = regex.exec(name)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const variant = m[1].toUpperCase() as VariantProperty;
      const param = m[2];
      variants.push(variant);
    }
  });
  return [...new Set(variants)];
}
