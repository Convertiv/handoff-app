import { SelectComponent, SelectComponents } from '../../../exporters/components/component_sets/select';
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

enum Parts {
  Select          = 'select',
  Label           = 'label',
  Option          = 'option',
  Icon            = 'icon',
  AdditionalInfo  = 'additional-info',
}

/**
 * Transfor selects into scss variants
 * @param selects
 * @returns
 */
export const transformSelectComponentsToScssTypes = (selects: SelectComponents): string => {
  const lines = [];
  lines.push(
    `$select-sizes: ( ${getSizesFromComponents(selects)
      .map((type) => `"${mapComponentSize(type, 'select')}"`)
      .join(', ')} );`
  );
  lines.push(
    `$select-themes: ( ${getThemesFromComponents(selects)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$select-states: ( ${getStatesFromComponents(selects)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  return lines.join('\n\n') + '\n';
};

/**
 * Transform select comonent into scss variables
 * @param tokens
 * @returns
 */
export const transformSelectComponentTokensToScssVariables = (tokens: SelectComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? 'default' : mapComponentSize(tokens.size, 'select');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    /**
     * Main part
     */
    // Background
    [getScssVariableName({ component: 'select', part: '', property: 'background', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Parts.Select,
    },
    // Padding
    [getScssVariableName({ component: 'select', part: '', property: 'padding-top', theme, type, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Parts.Select,
    },
    [getScssVariableName({ component: 'select', part: '', property: 'padding-right', theme, type, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Parts.Select,
    },
    [getScssVariableName({ component: 'select', part: '', property: 'padding-bottom', theme, type, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts.Select,
    },
    [getScssVariableName({ component: 'select', part: '', property: 'padding-left', theme, type, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Parts.Select,
    },
    // Border
    [getScssVariableName({ component: 'select', part: '', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Parts.Select,
    },
    [getScssVariableName({ component: 'select', part: '', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Parts.Select,
    },
    [getScssVariableName({ component: 'select', part: '', property: 'border-color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Parts.Select,
    },
    // Box shadow
    [getScssVariableName({ component: 'select', part: '', property: 'box-shadow', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts.Select,
    },
    /**
     * Label part
     */
    [getScssVariableName({ component: 'select', part: 'label', property: 'spacing', theme, type, state })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'margin-bottom',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Parts.Label,
    },
    [getScssVariableName({ component: 'select', part: 'label', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.label.color).color,
      property: 'color',
      group: Parts.Label,
    },
    /**
     * Option part
     */
    [getScssVariableName({ component: 'select', part: 'option', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.option.fontFamily}'`,
      property: 'font-family',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.option.fontSize}px`,
      property: 'font-size',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.option.fontWeight}`,
      property: 'font-weight',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.option.lineHeight}`,
      property: 'line-height',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.option.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.option.textAlign),
      property: 'text-align',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.option.textCase),
      property: 'text-transform',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.option.textDecoration),
      property: 'text-decoration',
      group: Parts.Option,
    },
    [getScssVariableName({ component: 'select', part: 'option', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.option.color).color,
      property: 'color',
      group: Parts.Option,
    },
    /**
     * Icon part
     */
    [getScssVariableName({ component: 'select', part: 'icon', property: 'width', theme, type, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width',
      group: Parts.Icon,
    },
    [getScssVariableName({ component: 'select', part: 'icon', property: 'width-raw', theme, type, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw',
      group: Parts.Icon,
    },
    [getScssVariableName({ component: 'select', part: 'icon', property: 'height', theme, type, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height',
      group: Parts.Icon,
    },
    [getScssVariableName({ component: 'select', part: 'icon', property: 'height-raw', theme, type, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw',
      group: Parts.Icon,
    },
    [getScssVariableName({ component: 'select', part: 'icon', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color',
      group: Parts.Icon,
    },
    /**
     * Additional info part
     */
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'spacing', theme, type, state })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font-family',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font-size',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font-weight',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line-height',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text-align',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text-transform',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text-decoration',
      group: Parts.AdditionalInfo,
    },
    [getScssVariableName({ component: 'select', part: 'additional-info', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.additionalInfo.color).color,
      property: 'color',
      group: Parts.AdditionalInfo,
    },
  };
};
