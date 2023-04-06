import { InputComponent, InputComponents } from '../../../exporters/components/component_sets/input';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaColorToCssColor,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { cssCodeBlockComment } from '../utils';
import { mapComponentSize } from '../../../utils/config';

/**
 * Generate css variable list from input components
 * @param inputs
 * @returns
 */
export const transformInputComponentsToCssVariables = (inputs: InputComponents): string => {
  const lines = [];
  lines.push('.input {')
  const cssVars = inputs.map((input) => `${cssCodeBlockComment('input', input)}\n ${Object.entries(transformInputComponentTokensToCssVariables(input))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

export const transformInputComponentTokensToCssVariables = (tokens: InputComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? undefined : mapComponentSize(tokens.size);
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    // Background
    [getCssVariableName({ component: 'input', property: 'background', type, theme, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background color',
    },

    [getCssVariableName({ component: 'input', property: 'bg', type, theme, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background color',
    },
    // Padding
    [getCssVariableName({ component: 'input', property: 'padding-y', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'vertical padding',
    },
    [getCssVariableName({ component: 'input', property: 'padding-x', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'horizontal padding',
    },
    [getCssVariableName({ component: 'input', property: 'padding-top', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'top padding',
    },
    [getCssVariableName({ component: 'input', property: 'padding-right', type, theme, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'right padding',
    },
    [getCssVariableName({ component: 'input', property: 'padding-bottom', type, theme, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'bottom padding',
    },
    [getCssVariableName({ component: 'input', property: 'padding-left', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'left padding',
    },

    // Border
    [getCssVariableName({ component: 'input', property: 'border-width', type, theme, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border width',
    },
    [getCssVariableName({ component: 'input', property: 'border-radius', type, theme, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border radius',
    },
    [getCssVariableName({ component: 'input', property: 'border-color', type, theme, state })]: {
      value: tokens.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border color',
    },

    // Font
    [getCssVariableName({ component: 'input', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font family',
    },
    [getCssVariableName({ component: 'input', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font size',
    },
    [getCssVariableName({ component: 'input', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font weight',
    },
    [getCssVariableName({ component: 'input', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.text.lineHeight}`,
      property: 'line height',
    },
    [getCssVariableName({ component: 'input', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter spacing',
    },
    [getCssVariableName({ component: 'input', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text alignment',
    },
    [getCssVariableName({ component: 'input', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text decoration',
    },
    [getCssVariableName({ component: 'input', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text transformation',
    },
    [getCssVariableName({ component: 'input', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.text.color),
      property: 'text color',
    },

    // Box shadow
    [getCssVariableName({ component: 'input', property: 'box-shadow', type, theme, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box shadow',
    },

    /**
     * Label part
     */
    [getCssVariableName({ component: 'input', part: 'label', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.label.spacing}px`,
      property: 'spacing',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font family',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font size',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font weight',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line height',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter spacing',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text alignment',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text decoration',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text transformation',
    },
    [getCssVariableName({ component: 'input', part: 'label', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'text color',
    },

    /**
     * Icon part
     */
    [getCssVariableName({ component: 'input', part: 'icon', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.icon.borderWeight}px`,
      property: 'border width',
    },
    [getCssVariableName({ component: 'input', part: 'icon', property: 'border-color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.icon.borderColor),
      property: 'border color',
    },

    /**
     * Additional info part
     */
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.spacing}px`,
      property: 'spacing',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.additionalInfo.fontFamily}'`,
      property: 'font family',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.fontSize}px`,
      property: 'font size',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.fontWeight}`,
      property: 'font weight',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.lineHeight}`,
      property: 'line height',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.additionalInfo.letterSpacing}px`,
      property: 'letter spacing',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text alignment',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text decoration',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text transformation',
    },
    [getCssVariableName({ component: 'input', part: 'additional-info', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.additionalInfo.color),
      property: 'text color',
    },
  };
};
