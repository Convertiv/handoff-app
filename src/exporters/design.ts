import chalk from 'chalk';
import { getFileNodes, getFileStyles } from '../figma/api';
import { ColorObject, EffectObject, TypographyObject } from '../types';
import { transformFigmaColorToHex, transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor } from '../utils/convertColor';
import { isShadowEffectType, isValidEffectType, isValidGradientType } from './utils';

interface GroupNameData {
  name: string;
  machine_name: string;
  group: string;
}

/**
 * Create a machine name from a string
 * @param name
 * @returns string
 */
export const toMachineName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/gi, '')
    .replace(/\s\-\s|\s+/gi, '-');
};

/**
 * Create a machine name from a string
 * @param name
 * @returns string
 */
export const toSDMachineName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/gi, '-')
    .replace(/\s\-\s|\s+/gi, '-')
    .replace(/-+/gi, '-')
    .replace(/(^,)|(,$)/g, '');
};

/**
 * Extracts the group name and machine name from a string
 * @param name
 * @returns GroupNameData
 */
const fieldData = (name: string): GroupNameData => {
  let nameArray = name.split('/');
  const data = {
    name: '',
    machine_name: '',
    group: '',
  };
  if (nameArray[1]) {
    data.group = toMachineName(nameArray[0]!);
    data.name = nameArray.splice(1).join(' ');
    data.machine_name = toMachineName(data.name);
  } else {
    data.name = nameArray[0]!;
    data.machine_name = toMachineName(data.name);
  }
  return data;
};

/**
 * Checks if input is an array
 * @param input
 * @returns boolean
 */
const isArray = (input: any): input is any[] | readonly any[] => {
  return Array.isArray(input);
};

/**
 * Fetches design tokens from a Figma file
 * @param fileId
 * @param accessToken
 * @returns Promise <{ color: ColorObject[]; typography: TypographyObject[]; effect: EffectObject[]; }>
 */
export const getFigmaFileDesignTokens = async (
  fileId: string,
  accessToken: string
): Promise<{
  color: ColorObject[];
  typography: TypographyObject[];
  effect: EffectObject[];
}> => {
  try {
    const apiResponse = await getFileStyles(fileId, accessToken);
    const file = apiResponse.data;
    const styles = file.meta.styles;
    const nodeMeta = styles.map((item) => ({
      node_id: item.node_id,
      sort_position: item.sort_position,
    }));
    const nodeIds = nodeMeta
      .sort((a, b) => {
        if (a.sort_position < b.sort_position) {
          return -1;
        }
        if (a.sort_position > b.sort_position) {
          return 1;
        }
        return 0;
      })
      .map((item) => item.node_id);

    const childrenApiResponse = await getFileNodes(fileId, nodeIds, accessToken);
    const tokens = Object.entries(childrenApiResponse.data.nodes);
    const colorsArray: ColorObject[] = [];
    const effectsArray: EffectObject[] = [];
    const typographyArray: TypographyObject[] = [];

    tokens.forEach(([_, node]) => {
      if (!node) {
        return;
      }

      let document = node.document;
      if (document.type === 'RECTANGLE') {
        let { name, machine_name, group } = fieldData(document.name);
        if (isArray(document.effects) && document.effects.length > 0) {
          effectsArray.push({
            id: document.id,
            reference: `effect-${group}-${machine_name}`,
            name,
            machineName: machine_name,
            group,
            effects: document.effects
              .filter((effect) => isValidEffectType(effect.type) && effect.visible)
              .map((effect) => ({
                type: effect.type,
                value: isShadowEffectType(effect.type) ? transformFigmaEffectToCssBoxShadow(effect) : '',
              })),
          });
        } else if (
          isArray(document.fills) &&
          document.fills[0] &&
          (document.fills[0].type === 'SOLID' || isValidGradientType(document.fills[0].type))
        ) {
          const color = transformFigmaFillsToCssColor(document.fills);
          colorsArray.push({
            id: document.id,
            name,
            group,
            value: color.color,
            blend: color.blend,
            sass: `$color-${group}-${machine_name}`,
            reference: `color-${group}-${machine_name}`,
            machineName: machine_name,
          });
        }
      }
      if (document.type === 'TEXT') {
        let { machine_name, group } = fieldData(document.name);
        let color: string | undefined;

        if (isArray(document.fills) && document.fills[0] && document.fills[0].type === 'SOLID' && document.fills[0].color) {
          color = transformFigmaColorToHex(document.fills[0].color);
        }
        typographyArray.push({
          id: document.id,
          reference: `typography-${group}-${machine_name}`,
          name: document.name,
          machine_name,
          group,
          values: {
            // @ts-ignore
            ...document.style,
            color,
          },
        });
      }
    });

    chalk.green('Colors, Effects and Typography Exported');
    const data = {
      color: colorsArray,
      effect: effectsArray,
      typography: typographyArray,
    };
    return data;
  } catch (err) {
    throw new Error(
      'An error occured fetching Colors and Typography.  This typically happens when the library cannot be read from Handoff'
    );
    return { color: [], typography: [], effect: [] };
  }
};
