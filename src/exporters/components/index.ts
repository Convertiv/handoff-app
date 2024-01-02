import chalk from 'chalk';
import * as FigmaTypes from '../../figma/types';
import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import { filterByNodeType } from '../utils';
import { ComponentDefinition } from '../../types';
import extractComponentInstances from './extractor';
import { AxiosResponse } from 'axios';
import { slugify } from '../../utils';
import { IComponentSetMetadata } from '../../types/plugin';
import { FileComponentsObject } from './types';

const groupReplaceRules = (tupleList: [string, string, string][]): { [key: string]: { [key: string]: string } } => {
  const res: { [key: string]: { [key: string]: string } } = {};

  tupleList.forEach(tuple => {
    const variantProp = tuple[0];
    const find = slugify(tuple[1]);
    const replace = tuple[2];

    if (!res[variantProp]) {
      res[variantProp] = {};
    }

    res[variantProp][find] = replace;
  });

  return res;
}

const getComponentSetComponentDefinition = (componentSet: FigmaTypes.ComponentSet): ComponentDefinition => {
  const metadata = JSON.parse(
    componentSet.sharedPluginData[`convertiv_handoff_app`][`node_${componentSet.id}_settings`]
  ) as IComponentSetMetadata;

  const id = componentSet.id;
  const name = slugify(metadata.name);

  const variantProperties = Object.entries(componentSet.componentPropertyDefinitions)
    .map(([variantPropertyName, variantPropertyDefinition]) => {
      return {
        name: variantPropertyName,
        type: variantPropertyDefinition.type,
        default: variantPropertyDefinition.defaultValue,
        options: variantPropertyDefinition.variantOptions ?? [],
      };
    })
    .filter((variantProperty) => variantProperty.type === 'VARIANT');

  return {
    id,
    name,
    group: 'Component', // TODO
    options: {
      shared: {
        defaults: variantProperties.reduce((map, current) => {
          return { ...map, [current.name]: slugify(current.default.toString()) };
        }, {} as Record<string, string>),
      },
      exporter: {
        variantProperties: variantProperties.map((variantProp) => variantProp.name),
        sharedComponentVariants: metadata.sharedVariants,
      },
      transformer: {
        cssRootClass: name === 'button' ? 'btn' : name, // TODO
        tokenNameSegments: metadata.tokenNameSegments,
        replace: groupReplaceRules(metadata.replacements),
      },
    },
    parts: metadata.parts.map((part) => ({
      id: slugify(part.name),
      tokens: part.definitions,
    })),
  };
};

const getComponentNodesWithMetadata = (
  componentSet: FigmaTypes.ComponentSet,
  componentsMetadata: ReadonlyMap<string, FigmaTypes.ComponentMetadata>
) => {
  return componentSet.children.map((component) => ({
    node: component,
    metadata: componentsMetadata.get(component.id),
  }));
};

export const getFigmaFileComponents = async (fileId: string, accessToken: string): Promise<FileComponentsObject> => {
  let fileComponentSetsRes: AxiosResponse<FigmaTypes.FileComponentSetsResponse, any>;

  try {
    fileComponentSetsRes = await getComponentSets(fileId, accessToken);
  } catch (err) {
    throw new Error(
      'Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide'
    );
  }

  if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
    console.error(
      chalk.red(
        'Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'
      )
    );

    console.log(chalk.blue('Continuing fetch with only colors and typography design foundations'));

    return {};
  }

  const componentSetNodesResult = await getComponentSetNodes(
    fileId,
    fileComponentSetsRes.data.meta.component_sets.map((item) => item.node_id),
    accessToken
  );

  const componentSets = Object.values(componentSetNodesResult.data.nodes)
    .map((node) => node?.document)
    .filter(filterByNodeType('COMPONENT_SET'))
    .filter((componentSet) => {
      try {
        if (!componentSet.sharedPluginData || !componentSet.sharedPluginData[`convertiv_handoff_app`]) {
          return false;
        }
        const settings = JSON.parse(
          componentSet.sharedPluginData[`convertiv_handoff_app`][`node_${componentSet.id}_settings`]
        ) as IComponentSetMetadata;
        return settings.exposed;
      } catch {
        return false;
      }
    });

  const componentsMetadata = new Map(
    Object.entries(
      Object.values(componentSetNodesResult.data.nodes)
        .map((node) => {
          return node?.components;
        })
        .reduce((acc, cur) => {
          return { ...acc, ...cur };
        }) ?? {}
    )
  );

  const componentTokens: FileComponentsObject = {};

  for (const componentSet of componentSets) {
    const definition = getComponentSetComponentDefinition(componentSet);

    if (!componentTokens[definition.name]) {
      componentTokens[definition.name] = {
        instances: [],
        definitions: {},
      };
    }

    const components = getComponentNodesWithMetadata(componentSet, componentsMetadata);

    componentTokens[definition.name].instances = [
      ...componentTokens[definition.name].instances,
      ...extractComponentInstances(components, definition),
    ];

    componentTokens[definition.name].definitions[componentSet.id] = definition;
  }

  return componentTokens;
};