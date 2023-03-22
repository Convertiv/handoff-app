import chalk from 'chalk';
import { getFileNodes, getFileStyles } from '../figma/api';
import { ColorObject, EffectParametersObject, EffectObject, TypographyObject } from '../types';
import { figmaColorToHex, figmaPaintToGradiant, figmaPaintToHex } from '../utils/convertColor';
import { isValidEffectType } from './components/utils';

interface GroupNameData {
  name: string;
  machine_name: string;
  group: string;
}

const fieldData = (name: string): GroupNameData => {
  let nameArray = name.split('/');
  const data = {
    name: '',
    machine_name: '',
    group: '',
  };
  if (nameArray[1]) {
    data.group = nameArray[0]!.toLowerCase();
    data.name = nameArray[1];
    data.machine_name = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, ' ')
      .replaceAll('  ', ' ')
      .replaceAll(' ', '-');
  } else {
    data.name = nameArray[0]!;
    data.machine_name = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, ' ')
      .replaceAll('  ', ' ')
      .replaceAll(' ', '-');
  }
  return data;
};

const isArray = (input: any): input is any[] | readonly any[] => {
  return Array.isArray(input);
};

const getFileDesignTokens = async (fileId: string, accessToken: string) => {
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
            name,
            group,
            effects: document.effects
              .filter((effect) =>
                isValidEffectType(effect.type))
              .map((effect) => ({
                type: effect.type,
                visible: effect.visible,
                color: effect.color,
                offset: effect.offset,
                radius: effect.radius,
              } as EffectParametersObject))
          });
        } else if (isArray(document.fills) && document.fills[0] && (document.fills[0].type === 'SOLID' || document.fills[0].type === 'GRADIENT_LINEAR')) {
          const color = document.fills[0];
          colorsArray.push({
            name,
            group,
            type: color.type,
            hex: figmaPaintToHex(color),
            rgb: color.color ?? null,
            sass: `$color-${group}-${machine_name}`,
            gradient: figmaPaintToGradiant(color)
          });
        }
      }
      if (document.type === 'TEXT') {
        let { machine_name, group } = fieldData(document.name);
        let color: string | undefined;

        if (isArray(document.fills) && document.fills[0] && document.fills[0].type === 'SOLID' && document.fills[0].color) {
          color = figmaColorToHex(document.fills[0].color);
        }

        typographyArray.push({
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

    console.log(chalk.green('Colors and Typography Exported'));
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
    return { color: [], typography: [] };
  }
};

export default getFileDesignTokens;
