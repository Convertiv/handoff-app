import chalk from 'chalk';
import * as FigmaTypes from '../../figma/types';
import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import { filterByNodeType } from '../utils';
import { ExportableDefinition } from '../../types';
import extractComponents, { Component } from './extractor';
import { AxiosResponse } from 'axios';

export interface DocumentComponentsObject {
  [key: string]: Component[];
}

export interface GetComponentSetComponentsResult {
  components: FigmaTypes.Component[];
  metadata: { [k: string]: FigmaTypes.ComponentMetadata };
}

const getComponentSetComponents = (
  componentSets: ReadonlyArray<FigmaTypes.ComponentSet>,
  componentSetsMetadata: ReadonlyArray<FigmaTypes.FullComponentMetadata>,
  componentsMetadata: ReadonlyMap<string, FigmaTypes.ComponentMetadata>,
  name: string
): GetComponentSetComponentsResult => {
  // Retrieve the component set with the given name (search)
  const primaryComponentSet = componentSets.find((componentSet) => componentSet.name === name);
  // Check if the component set exists
  if (!primaryComponentSet) {
    throw new Error(`No component set found for ${name}`);
  }
  // Locate component set metadata
  const primaryComponentSetMetadata = componentSetsMetadata.find((metadata) => metadata.node_id === primaryComponentSet.id);
  // Find ids of all other component sets located within the same containing frame of the found component set
  const relevantComponentSetsIds = primaryComponentSetMetadata
    ? componentSetsMetadata
        .filter(
          (metadata) =>
            metadata.node_id !== primaryComponentSetMetadata.node_id &&
            metadata.containing_frame.nodeId === primaryComponentSetMetadata.containing_frame.nodeId
        )
        .map((meta) => meta.node_id)
    : [];
  // Reduce array of component sets to a array of components (component set children) based on the array of relevant component sets ids
  const relevantComponents = componentSets.reduce((res, componentSet) => {
    return relevantComponentSetsIds.includes(componentSet.id) ? res.concat(componentSet.children) : res;
  }, [] as FigmaTypes.Component[]);
  // Define final list of components 
  const components = [...primaryComponentSet.children, ...(relevantComponents || [])];
  // Define final list of metadata (of all final components)
  const metadata = Object.fromEntries(
    Array.from(componentsMetadata.entries()).filter(([componentId]) => components.map((child) => child.id).includes(componentId))
  );
  // Return the result
  return {
    components,
    metadata,
  };
}

const getFileComponentTokens = async (fileId: string, accessToken: string, exportables: ExportableDefinition[]): Promise<DocumentComponentsObject> => {
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

  const componentSetsNodesRes = await getComponentSetNodes(
    fileId,
    fileComponentSetsRes.data.meta.component_sets.map((item) => item.node_id),
    accessToken
  );

  const componentSets = Object.values(componentSetsNodesRes.data.nodes)
    .map((node) => node?.document)
    .filter(filterByNodeType('COMPONENT_SET'));

  const componentSetsMetadata = fileComponentSetsRes.data.meta.component_sets;

  const componentsMetadata = new Map(
    Object.entries(
      Object.values(componentSetsNodesRes.data.nodes)
        .map((node) => {
          return node?.components;
        })
        .reduce((acc, cur) => {
          return { ...acc, ...cur };
        }) ?? {}
    )
  );

  const componentTokens: DocumentComponentsObject = {}

  for (const exportable of exportables) {
    if (!exportable.id) {
      console.error(
        chalk.red(
          'Handoff could not process exportable component without a id.\n  - Please update the exportable definition to include the name of the component.\n - For more information, see https://www.handoff.com/docs/guide'
        )
      );
      continue;
    }

    if (!exportable.options.exporter.search) {
      console.error(
        chalk.red(
          'Handoff could not process exportable component without search.\n  - Please update the exportable definition to include the search property.\n - For more information, see https://www.handoff.com/docs/guide'
        )
      );

      continue;
    }

    componentTokens[exportable.id ?? ''] = extractComponents(
      getComponentSetComponents(
        componentSets,
        componentSetsMetadata,
        componentsMetadata,
        exportable.options.exporter.search,
      ), exportable
    )
  }

  return componentTokens;
};

export default getFileComponentTokens;
