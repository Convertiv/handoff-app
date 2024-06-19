import chalk from 'chalk';
import * as FigmaTypes from '../../figma/types';
import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import { filterByNodeType, getComponentInstanceNamePart } from '../utils';
import { ComponentDefinition, ComponentDefinitionOptions, LegacyComponentDefinition } from '../../types';
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

const getComponentSetComponentDefinition = (componentSet: FigmaTypes.ComponentSet): ComponentDefinition | null => {
  const metadata = JSON.parse(
    componentSet.sharedPluginData[`convertiv_handoff_app`][`node_${componentSet.id}_settings`]
  ) as IComponentSetMetadata;

  const id = componentSet.id;
  const name = slugify(metadata.name);

  if (!componentSet.componentPropertyDefinitions) {
    return null;
  }

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
    group: '', // TODO
    options: {
      shared: {
        defaults: Object.entries(metadata.defaults).reduce((res, [variantProperty, defaultValue]) => {
          return { ...res, ...{ [variantProperty]: slugify(defaultValue) }}
        }, {}),
      },
      exporter: {
        variantProperties: variantProperties.map((variantProp) => variantProp.name),
        sharedComponentVariants: metadata.sharedVariants,
      },
      transformer: {
        cssRootClass: metadata.cssRootClass || name,
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

export const getFigmaFileComponents = async (fileId: string, accessToken: string, legacyDefinitions?: LegacyComponentDefinition[]): Promise<FileComponentsObject> => {
  const useLegacyFetchFlow = !!legacyDefinitions;

  let fileComponentSetsRes: AxiosResponse<FigmaTypes.FileComponentSetsResponse, any>;

  try {
    fileComponentSetsRes = await getComponentSets(fileId, accessToken);
  } catch (err) {
    throw new Error(
      'Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide'
    );
  }

  const fullComponentMetadataArray = fileComponentSetsRes.data.meta.component_sets;

  if (fullComponentMetadataArray.length === 0) {
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
    fullComponentMetadataArray.map((item) => item.node_id),
    accessToken
  );

  if (useLegacyFetchFlow) {
    return processFigmaNodesForLegacyDefinitions(componentSetNodesResult.data, fullComponentMetadataArray, legacyDefinitions);
  }

  return processFigmaNodes(componentSetNodesResult.data);
};

const processFigmaNodes = (fileNodesResponse: FigmaTypes.FileNodesResponse) => {
  // console.warn(
  //   chalk.redBright(
  //     '!!! Using Handoff Figma Plugin fetch flow !!!'
  //   )
  // );

  const componentTokens: FileComponentsObject = {};

  const componentsMetadata = new Map(
    Object.entries(
      Object.values(fileNodesResponse.nodes)
        .map((node) => {
          return node?.components;
        })
        .reduce((acc, cur) => {
          return { ...acc, ...cur };
        }) ?? {}
    )
  );

  const componentSets = Object.values(fileNodesResponse.nodes)
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

  for (const componentSet of componentSets) {
    const definition = getComponentSetComponentDefinition(componentSet);

    if (!definition) {
      continue;
    }

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
}

/**
 * Processes figma nodes by utilizing the legacy component definitions
 * @deprecated Will be removed before 1.0.0 release.
 */
const processFigmaNodesForLegacyDefinitions = (fileNodesResponse: FigmaTypes.FileNodesResponse, fullComponentMetadataArray: readonly FigmaTypes.FullComponentMetadata[], legacyDefinitions: LegacyComponentDefinition[]) => {
  console.warn(
    chalk.redBright(
      '!!! Using legacy fetch flow !!!'
    )
  );

  const componentTokens: FileComponentsObject = {};

  const componentsMetadata = new Map(
    Object.entries(
      Object.values(fileNodesResponse.nodes)
        .map((node) => {
          return node?.components;
        })
        .reduce((acc, cur) => {
          return { ...acc, ...cur };
        }) ?? {}
    )
  );

  const figmaComponentSetNodes = Object.values(fileNodesResponse.nodes)
    .map((node) => node?.document)
    .filter(filterByNodeType('COMPONENT_SET'));

  for (const legacyDefinition of legacyDefinitions) {
    if (!legacyDefinition.id) {
      console.error(
        chalk.red(
          'Handoff could not process exportable component without a id.\n  - Please update the exportable definition to include the name of the component.\n - For more information, see https://www.handoff.com/docs/guide'
        )
      );
      continue;
    }

    if (!legacyDefinition.options.exporter.search) {
      console.error(
        chalk.red(
          'Handoff could not process exportable component without search.\n  - Please update the exportable definition to include the search property.\n - For more information, see https://www.handoff.com/docs/guide'
        )
      );
      continue;
    }

    const componentSets = getComponentSetsForLegacyComponentDefinition(figmaComponentSetNodes, fullComponentMetadataArray, legacyDefinition);

    for (const componentSet of componentSets) {
      const definition = getComponentDefinitionForLegacyComponentDefinition(componentSet, legacyDefinition);

      if (!componentTokens[definition.name]) {
        componentTokens[definition.name] = {
          instances: [],
          definitions: {},
        };
      }

      const components = getComponentNodesWithMetadata(componentSet, componentsMetadata);

      componentTokens[definition.name].instances = [
        ...componentTokens[definition.name].instances,
        ...extractComponentInstances(components, definition, legacyDefinition),
      ];

      componentTokens[definition.name].definitions[componentSet.id] = definition;
    }
  }

  return componentTokens;
}

/**
 * Returns the legacy component definition variant property with all associated parameters.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getComponentPropertyWithParams = (variantProperty: string) => {
  const regex = /^([^:]+)(?:\(([^)]+)\))?$/;
  const matches = variantProperty.match(regex);

  if (!matches || matches.length !== 3) {
    return null; // ignore if format is invalid
  }

  const key = matches[1].trim();
  const value = matches[2]?.trim();

  return {
    variantProperty: key,
    params: value ? value.substring(1).split(':').map(param => param.split(/\/(.*)/s).slice(0, 2) as [string, string]) : undefined,
  };
}

/**
 * Returns the new component definition for the provided component set and respective legacy definition.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getComponentDefinitionForLegacyComponentDefinition = (componentSet: FigmaTypes.ComponentSet, legacyDefinition: LegacyComponentDefinition): ComponentDefinition => {
  const supportedVariantProps = [
    ...legacyDefinition?.options?.exporter?.supportedVariantProps?.design ?? [],
    ...legacyDefinition?.options?.exporter?.supportedVariantProps?.layout ?? [],
  ];

  const definitionSupportedVariantProperties = supportedVariantProps.map((variantProp) => variantProp.replace(/ *\([^)]*\) */g, ''));
  const definitionSupportedVariantPropertiesWithShareParams = supportedVariantProps.filter(variantProperty => variantProperty.match((/ *\([^)]*\) */g)));

  const variantProperties = Object.entries(componentSet.componentPropertyDefinitions)
    .map(([variantPropertyName, variantPropertyDefinition]) => {
      return {
        name: variantPropertyName,
        type: variantPropertyDefinition.type,
        default: variantPropertyDefinition.defaultValue,
        options: variantPropertyDefinition.variantOptions ?? [],
      };
    })
    .filter((variantProperty) => variantProperty.type === 'VARIANT' && definitionSupportedVariantProperties.includes(variantProperty.name));

  const sharedComponentVariants: ComponentDefinitionOptions["exporter"]["sharedComponentVariants"] = [];

  if (definitionSupportedVariantPropertiesWithShareParams.length > 0) {
    definitionSupportedVariantPropertiesWithShareParams.forEach((item) => {
      const shareDefinition = getComponentPropertyWithParams(item);
      shareDefinition.params.forEach(([searchValue, distinctiveVariantPropertiesStr]) => {
        componentSet.children
          .filter((component) => {
            return slugify(getComponentInstanceNamePart(component.name, shareDefinition.variantProperty) ?? '') === slugify(searchValue);
          })
          .forEach((component) =>
            sharedComponentVariants.push({
              componentId: component.id,
              distinctiveVariantProperties: distinctiveVariantPropertiesStr.split(','),
              sharedVariantProperty: shareDefinition.variantProperty,
            })
          );
      });
    });
  }

  return {
    id: componentSet.id,
    name: legacyDefinition.id,
    group: legacyDefinition.group,
    options: {
      shared: {
        defaults: legacyDefinition.options.shared?.defaults ?? {},
      },
      exporter: {
        variantProperties: variantProperties.map((variantProp) => variantProp.name),
        sharedComponentVariants,
      },
      transformer: {
        cssRootClass: legacyDefinition.options.transformer?.cssRootClass ?? legacyDefinition.id,
        tokenNameSegments: legacyDefinition.options.transformer?.tokenNameSegments,
        replace: legacyDefinition.options.transformer?.replace,
      },
    },
    parts: legacyDefinition.parts,
  };
}

/**
 * Returns the array of component sets that match the search critera of the provided legacy component definition.
 * @deprecated Will be removed before 1.0.0 release.
 */
const getComponentSetsForLegacyComponentDefinition = (
  componentSets: ReadonlyArray<FigmaTypes.ComponentSet>,
  componentSetsMetadata: ReadonlyArray<FigmaTypes.FullComponentMetadata>,
  legacyDefinition: LegacyComponentDefinition
) => {
  // Retrieve the component set with the given name (search)
  const primaryComponentSet = componentSets.find((componentSet) => componentSet.name === legacyDefinition.options.exporter.search);
  // Check if the component set exists
  if (!primaryComponentSet) {
    throw new Error(`No component set found for ${legacyDefinition.options.exporter.search}`);
  }
  // Locate component set metadata
  const primaryComponentSetMetadata = componentSetsMetadata.find((metadata) => metadata.node_id === primaryComponentSet.id);
  // Find other component sets located within the same containing frame of the found component set
  const releavantComponentSets = primaryComponentSetMetadata
    ? componentSetsMetadata
      .filter(
        (metadata) =>
          metadata.node_id !== primaryComponentSetMetadata.node_id &&
          metadata.containing_frame.nodeId === primaryComponentSetMetadata.containing_frame.nodeId
      )
      .map((meta) => componentSets.find((componentSet) => componentSet.id === meta.node_id))
    : [];
  // Return the result
  return [primaryComponentSet, ...releavantComponentSets];
};