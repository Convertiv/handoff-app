import { RadioComponent, RadioComponents } from '../../../exporters/components/component_sets/radio';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents, transformFigmaColorToCssColor } from '../../css/utils';
import { mapComponentSize } from '../../../utils/config';

enum Parts {
  Radio  = 'radio',
  Label  = 'label',
  Thumb  = 'thumb',
}

/**
 * Build a list of SCSS variants from radio components
 * @param radios
 * @returns
 */
export const transformRadioComponentsToScssTypes = (radios: RadioComponents): string => {
  const lines = [];
  lines.push(
    `$radio-sizes: ( ${getSizesFromComponents(radios)
      .map((type) => `"${mapComponentSize(type)}"`)
      .join(', ')} );`
  );
  lines.push(
    `$radio-themes: ( ${getThemesFromComponents(radios)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$radio-states: ( ${getStatesFromComponents(radios)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  return lines.join('\n\n') + '\n';
};

/**
 * Build SCSS tokens from radio
 * @param tokens
 * @returns
 */
export const transformRadioComponentTokensToScssVariables = (tokens: RadioComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.state : mapComponentSize(tokens.size);
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';

  return {
    /**
     * Main part
     */
    // Button background
    [getScssVariableName({ component: 'radio', part: '', property: 'background', type, theme, state })]: {
      value: tokens.parts.check.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
      group: Parts.Radio,
    },
    // Size
    [getScssVariableName({ component: 'radio', part: '', property: 'width', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'width-raw', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'height', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'height-raw', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw',
      group: Parts.Radio,
    },
    // Padding
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-y', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-x', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-x',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-top', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-right', type, theme, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-bottom', type, theme, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-left', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', part: '', property: 'padding-start', type, theme, state })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'padding-start',
      group: Parts.Radio,
    },
    // Border
    [getScssVariableName({ component: 'radio', part: '', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border-width',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', property: 'border-radius', type, theme, state })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border-radius',
      group: Parts.Radio,
    },
    [getScssVariableName({ component: 'radio', property: 'border-color', type, theme, state })]: {
      value: tokens.parts.check.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
      group: Parts.Radio,
    },
    // Opacity
    [getScssVariableName({ component: 'radio', part: '', property: 'opacity', type, theme, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Parts.Radio,
    },
    // Box shadow
    [getScssVariableName({ component: 'radio', part: '', property: 'box-shadow', type, theme, state })]: {
      value: tokens.parts.check.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts.Radio,
    },
    /**
     * Label part
     */
    [getScssVariableName({ component: 'radio', part: 'label', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transformation',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'color',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'radio', part: 'label', property: 'opacity', type, theme, state })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
      group: Parts.Label,
    },
    /**
     * Thumb part
     */
    // Size
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'width', type, theme, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width',
      group: Parts.Thumb,
    },
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'width-raw', type, theme, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw',
      group: Parts.Thumb,
    },
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'height', type, theme, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height',
      group: Parts.Thumb,
    },
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'height-raw', type, theme, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw',
      group: Parts.Thumb,
    },
    // Background
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'background', type, theme, state })]: {
      value: tokens.parts.thumb.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
      group: Parts.Thumb,
    },
    // Border
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width',
      group: Parts.Thumb,
    },
    [getScssVariableName({ component: 'radio', part: 'thumb', property: 'border-color', type, theme, state })]: {
      value: tokens.parts.thumb.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
      group: Parts.Thumb,
    },
  };
};
