import { getComponentSetNodes, getComponentSets } from '../../figma/api';
import * as FigmaTypes from '../../figma/types';
import { filterByNodeType } from './utils';
import extractButtonComponents, { ButtonComponents } from './component_sets/button';
import extractSelectComponents, { SelectComponents } from './component_sets/select';
import extractTooltipComponents, { TooltipComponents } from './component_sets/tooltip';
import extractInputComponents, { InputComponents } from './component_sets/input';
import extractAlertComponents, { AlertComponents } from './component_sets/alert';
import extractCheckboxComponents, { CheckboxComponents } from './component_sets/checkbox';
import extractSwitchComponents, { SwitchComponents, SwitchDesignComponent } from './component_sets/switch';
import extractPaginationComponents, { PaginationComponents } from './component_sets/pagination';
import extractRadioComponents, { RadioComponents } from './component_sets/radio';
import extractModalComponents, { ModalComponents } from './component_sets/modal';
import chalk from 'chalk';
import { getConfig } from '../../utils';

export interface DocumentComponentsObject {
  [key: string]: any;
  buttons: ButtonComponents;
  selects: SelectComponents;
  tooltips: TooltipComponents;
  modal: ModalComponents;
  inputs: InputComponents;
  alerts: AlertComponents;
  checkboxes: CheckboxComponents;
  radios: RadioComponents;
  switches: SwitchComponents;
  pagination: PaginationComponents;
}

export interface GetComponentSetComponentsResult {
  components: FigmaTypes.Component[];
  metadata: { [k: string]: FigmaTypes.ComponentMetadata };
}

function getComponentSetComponents(
  metadata: ReadonlyArray<FigmaTypes.FullComponentMetadata>,
  componentSets: ReadonlyArray<FigmaTypes.ComponentSet>,
  componentMetadata: ReadonlyMap<string, FigmaTypes.ComponentMetadata>,
  name: string
): GetComponentSetComponentsResult {
  // console.log(componentSets.map((componentSet) => componentSet.name));
  const componentSet = componentSets.find((componentSet) => componentSet.name === name);
  if (!componentSet) {
    // TODO: remove this when all component sets are implemented
    return { components: [], metadata: {} };
    throw new Error(`No component set found for ${name}`);
  }

  const componentSetMetadata = metadata.find((metadata) => metadata.node_id === componentSet.id);
  const baseComponentSetMetadata = componentSetMetadata
    ? metadata.find(
        (metadata) =>
          metadata.node_id !== componentSetMetadata.node_id &&
          metadata.containing_frame.nodeId === componentSetMetadata.containing_frame.nodeId
      )
    : undefined;
  const baseComponentSet = baseComponentSetMetadata
    ? componentSets.find((componentSet) => componentSet.id === baseComponentSetMetadata.node_id)
    : undefined;

  const components = [...componentSet.children, ...(baseComponentSet?.children || [])];

  const componentsMetadata = Object.fromEntries(
    Array.from(componentMetadata.entries()).filter(([key]) => components.map((child) => child.id).includes(key))
  );

  return {
    components: components,
    metadata: componentsMetadata,
  };
}

const getFileComponentTokens = async (fileId: string, accessToken: string): Promise<DocumentComponentsObject> => {
  let fileComponentSetsRes;
  try {
    fileComponentSetsRes = await getComponentSets(fileId, accessToken);
  } catch (err) {
    console.log(
      chalk.red(
        'Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide'
      )
    );
    throw new Error('Could not find or access the file.');
  }
  if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
    console.error(
      chalk.red(
        'Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'
      )
    );
    console.log(chalk.blue('Continuing fetch with only colors and typography design foundations'));
    return {
      buttons: [],
      selects: [],
      checkboxes: [],
      radios: [],
      inputs: [],
      tooltips: [],
      alerts: [],
      switches: [],
      pagination: [],
      modal: [],
    };
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
  const config = await getConfig();
  const figmaSearch = config.figma.components;
  return {
    buttons: figmaSearch.button
      ? extractButtonComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            figmaSearch.button.search ?? 'Button'
          )
        )
      : [],
    selects: figmaSearch.select
      ? extractSelectComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            figmaSearch.select.search ?? 'Select'
          )
        )
      : [],
    checkboxes: figmaSearch.checkbox
      ? extractCheckboxComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            figmaSearch.checkbox.search ?? 'Checkbox'
          )
        )
      : [],
    radios: figmaSearch.radio
      ? extractRadioComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            figmaSearch.radio.search ?? 'Radio'
          )
        )
      : [],
    inputs: figmaSearch.input
      ? extractInputComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            'Input'
          )
        )
      : [],
    tooltips: figmaSearch.tooltip
      ? extractTooltipComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            'Tooltip'
          )
        )
      : [],
    alerts: figmaSearch.alert
      ? extractAlertComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            'Alert'
          )
        )
      : [],
    switches: figmaSearch.switch
      ? extractSwitchComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            'Switch'
          )
        )
      : [],
    pagination: figmaSearch.pagination
      ? extractPaginationComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            'Pagination'
          )
        )
      : [],
    modal: figmaSearch.modal
      ? extractModalComponents(
          getComponentSetComponents(
            fileComponentSetsRes.data.meta.component_sets,
            componentSets,
            componentMetadata,
            'Modal'
          )
        )
      : [],
  };
};

export default getFileComponentTokens;
