import chalk from 'chalk';
import * as FigmaTypes from '../../figma/types';
import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import { filterByNodeType } from '../utils';
import { ExportableDefinition } from '../../types';
import extractComponents, { Component } from './extractor';

export interface DocumentComponentsObject {
  [key: string]: Component[];
}

export interface GetComponentSetComponentsResult {
  components: FigmaTypes.Component[];
  metadata: { [k: string]: FigmaTypes.ComponentMetadata };
}

const getComponentSetComponents = (
  metadata: ReadonlyArray<FigmaTypes.FullComponentMetadata>,
  componentSets: ReadonlyArray<FigmaTypes.ComponentSet>,
  componentMetadata: ReadonlyMap<string, FigmaTypes.ComponentMetadata>,
  name: string
): GetComponentSetComponentsResult => {
  const componentSet = componentSets.find((componentSet) => componentSet.name === name);
  if (!componentSet) {
    // TODO: remove this when all component sets are implemented
    return { components: [], metadata: {} };
    throw new Error(`No component set found for ${name}`);
  }

  const componentSetMetadata = metadata.find((metadata) => metadata.node_id === componentSet.id);

  const baseComponentSetMetadata = componentSetMetadata
    ? metadata.filter(
        (metadata) =>
          metadata.node_id !== componentSetMetadata.node_id &&
          metadata.containing_frame.nodeId === componentSetMetadata.containing_frame.nodeId
      )
    : undefined;

  const nodeIds = baseComponentSetMetadata.map(meta => meta.node_id);

  const children = componentSets
    .filter((componentSet) => nodeIds.includes(componentSet.id))
    .map(c => c.children)
    .reduce((acc, el) => acc.concat(el), []);

  const components = [...componentSet.children, ...(children || [])];

  const componentsMetadata = Object.fromEntries(
    Array.from(componentMetadata.entries()).filter(([key]) => components.map((child) => child.id).includes(key))
  );

  return {
    components: components,
    metadata: componentsMetadata,
  };
}

const getFileComponentTokens = async (fileId: string, accessToken: string, exportables: ExportableDefinition[]): Promise<DocumentComponentsObject> => {
  let fileComponentSetsRes;

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

  const componentMetadata = new Map(
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
        fileComponentSetsRes.data.meta.component_sets,
        componentSets,
        componentMetadata,
        exportable.options.exporter.search,
      ), exportable
    )
  }

  return componentTokens;
};

export default getFileComponentTokens;
