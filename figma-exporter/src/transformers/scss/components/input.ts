import { InputComponent, InputComponents } from '../../../exporters/components/component_sets/input';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaColorToCssColor,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents } from '../../css/utils';
import { mapComponentSize } from '../../../utils/config';

enum Part {
  Input = 'input',
  Icon = 'icon',
  Label = 'label',
  AdditionalInfo = 'additional-info'
}

/**
 * Generate variant maps from input components
 * @param inputs
 * @returns
 */
export const transformInputComponentsToScssTypes = (inputs: InputComponents): string => {
  const lines = [];
  lines.push(
    `$input-sizes: ( ${getSizesFromComponents(inputs)
      .map((type) => `"${mapComponentSize(type, 'input')}"`)
      .join(', ')} );`
  );
  lines.push(
    `$input-themes: ( ${getThemesFromComponents(inputs)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$input-states: ( ${getStatesFromComponents(inputs)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  return lines.join('\n\n') + '\n';
};

export const transformInputComponentTokensToScssVariables = (tokens: InputComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? undefined : mapComponentSize(tokens.size, 'input');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    /**
     * Main part
     */
    // Background
    [getScssVariableName({ component: 'input', property: 'background', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background-color',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'bg', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background-color',
      group: Part.Input,
    },
    // Padding
    [getScssVariableName({ component: 'input', property: 'padding-y', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'padding-x', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-x',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'padding-top', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'padding-right', type, theme, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'padding-bottom', type, theme, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'padding-left', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part.Input,
    },
    // Border
    [getScssVariableName({ component: 'input', property: 'border-width', type, theme, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'border-radius', type, theme, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'border-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part.Input,
    },
    // Font
    [getScssVariableName({ component: 'input', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font-family',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font-size',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font-weight',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.text.lineHeight}`,
      property: 'line-height',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text-align',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text-decoration',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text-transformation',
      group: Part.Input,
    },
    [getScssVariableName({ component: 'input', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.text.color),
      property: 'color',
      group: Part.Input,
    },
    // Box shadow
    [getScssVariableName({ component: 'input', property: 'box-shadow', type, theme, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part.Input,
    },
    /**
     * Label part
     */
    [getScssVariableName({ component: 'input', part: 'label', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'spacing',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-alignment',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transformation',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'input', part: 'label', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'color',
      group: Part.Label,
    },
    /**
     * Icon part
     */
    [getScssVariableName({ component: 'input', part: 'icon', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.icon.borderWeight}px`,
      property: 'border-width',
      group: Part.Icon,
    },
    [getScssVariableName({ component: 'input', part: 'icon', property: 'border-color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.icon.borderColor),
      property: 'border-color',
      group: Part.Icon,
    },
    /**
     * Additional info part
     */
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font-family',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font-size',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font-weight',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line-height',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text-align',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text-decoration',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text-transform',
      group: Part.AdditionalInfo,
    },
    [getScssVariableName({ component: 'input', part: 'additional-info', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.additionalInfo.color),
      property: 'color',
      group: Part.AdditionalInfo,
    },
  };
};
