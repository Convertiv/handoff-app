import { SwitchComponent, SwitchComponents } from '../../../exporters/components/component_sets/switch';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents } from '../../css/utils';
import { mapComponentSize } from '../../../utils/config';

enum Part {
  Switch  = 'switch',
  Label   = 'label',
  Thumb   = 'thumb',
}

/**
 * Transform switches into scss variants
 * @param switches
 * @returns
 */
export const transformSwitchesComponentsToScssTypes = (switches: SwitchComponents): string => {
  const lines = [];
  lines.push(
    `$switch-sizes: ( ${getSizesFromComponents(switches)
      .map((type) => `"${mapComponentSize(type, 'switch')}"`)
      .join(', ')} );`
  );
  lines.push(
    `$switch-themes: ( ${getThemesFromComponents(switches)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$switch-states: ( ${getStatesFromComponents(switches)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  return lines.join('\n\n') + '\n';
};

export const transformSwitchComponentTokensToScssVariables = (tokens: SwitchComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.state : mapComponentSize(tokens.size, 'switch');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';

  return {
    /**
     * Main part
     */
    // Spacing
    [getScssVariableName({ component: 'switch', part: '', property: 'padding-start', theme, type, state })]: {
      value: `${tokens.spacing ?? '0'}px`,
      property: 'padding-start',
      group: Part.Switch,
    },
    // Size
    [getScssVariableName({ component: 'switch', part: '', property: 'width', theme, type, state })]: {
      value: `${tokens.width ?? '0'}px`,
      property: 'width',
      group: Part.Switch,
    },
    [getScssVariableName({ component: 'switch', part: '', property: 'width-raw', theme, type, state })]: {
      value: `${tokens.width ?? '0'}`,
      property: 'width-raw',
      group: Part.Switch,
    },
    [getScssVariableName({ component: 'switch', part: '', property: 'height', theme, type, state })]: {
      value: `${tokens.height ?? '0'}px`,
      property: 'height',
      group: Part.Switch,
    },
    [getScssVariableName({ component: 'switch', part: '', property: 'height-raw', theme, type, state })]: {
      value: `${tokens.height ?? '0'}`,
      property: 'height-raw',
      group: Part.Switch,
    },
    // Background
    [getScssVariableName({ component: 'switch', part: '', property: 'background', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part.Switch,
    },
    // Border
    [getScssVariableName({ component: 'switch', part: '', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part.Switch,
    },
    [getScssVariableName({ component: 'switch', part: '', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part.Switch,
    },
    [getScssVariableName({ component: 'switch', part: '', property: 'border-color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part.Switch,
    },
    // Opacity
    [getScssVariableName({ component: 'switch', part: '', property: 'opacity', theme, type, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Part.Switch,
    },
    // Box shadow
    [getScssVariableName({ component: 'switch', part: '', property: 'box-shadow', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part.Switch,
    },
    /**
     * Label part
     */
    [getScssVariableName({ component: 'switch', part: 'label', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'switch', part: 'label', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.label.color).color,
      property: 'color',
      group: Part.Label,
    },
    // Opacity
    [getScssVariableName({ component: 'switch', part: 'label', property: 'opacity', theme, type, state })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
      group: Part.Label,
    },
    /**
     * THUMB PART
     */
    // Size
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'width', theme, type, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width',
      group: Part.Thumb,
    },
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'width-raw', theme, type, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw',
      group: Part.Thumb,
    },
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'height', theme, type, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height',
      group: Part.Thumb,
    },
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'height-raw', theme, type, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw',
      group: Part.Thumb,
    },
    // Background
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'background', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.thumb.background).color,
      property: 'background',
      group: Part.Thumb,
    },
    // Border
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'border-width', theme, type, state })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width',
      group: Part.Thumb,
    },
    [getScssVariableName({ component: 'switch', part: 'thumb', property: 'border-color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.thumb.borderColor).color,
      property: 'border-color',
      group: Part.Thumb,
    },
  };
};
