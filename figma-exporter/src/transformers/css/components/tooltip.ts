import { capitalize } from 'lodash';
import { TooltipComponents, TooltipComponentTokens } from '../../../exporters/components/component_sets/tooltip';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaColorToCssColor,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { cssCodeBlockComment } from '../utils';

/**
 * Build a css variable map for
 * @param tooltips
 * @returns
 */
export const transformTooltipComponentsToCssVariables = (tooltips: TooltipComponents): string => {
  const lines = [];
  lines.push('.tooltip {')
  const cssVars = tooltips.map((component) => `/* Tooltips Horizontal: ${component.horizontal} Vertical: ${component.vertical}*/ \n ${Object.entries(transformTooltipComponentTokensToCssVariables(component))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

export const transformTooltipComponentTokensToCssVariables = ({ ...tokens }: TooltipComponentTokens): Record<string, ValueProperty> => {
  return {
    // Background
    [getCssVariableName({ component: 'tooltip', property: 'background', part: '' })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
    },
    [getCssVariableName({ component: 'tooltip', property: 'bg', part: '' })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'bg',
    },

    // Padding
    [getCssVariableName({ component: 'tooltip', property: 'padding-y', part: '' })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
    },
    [getCssVariableName({ component: 'tooltip', property: 'padding-x', part: '' })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x',
    },
    [getCssVariableName({ component: 'tooltip', property: 'padding-top', part: '' })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'tooltip', property: 'padding-right', part: '' })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'tooltip', property: 'padding-bottom', part: '' })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'tooltip', property: 'padding-left', part: '' })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
    },

    // Border
    [getCssVariableName({ component: 'tooltip', property: 'border-width', part: '' })]: {
      value: `${tokens.borderWeight}`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'tooltip', property: 'border-radius', part: '' })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'tooltip', property: 'border-radius-sm', part: '' })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm',
    },
    [getCssVariableName({ component: 'tooltip', property: 'border-radius-lg', part: '' })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg',
    },
    [getCssVariableName({ component: 'tooltip', property: 'border-color', part: '' })]: {
      value: transformFigmaColorToCssColor(tokens.borderColor),
      property: 'border-color',
    },

    // Font
    [getCssVariableName({ component: 'tooltip', property: 'font-family', part: '' })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
    },
    [getCssVariableName({ component: 'tooltip', property: 'font-size', part: '' })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
    },
    [getCssVariableName({ component: 'tooltip', property: 'font-weight', part: '' })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
    },
    [getCssVariableName({ component: 'tooltip', property: 'line-height', part: '' })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
    },
    [getCssVariableName({ component: 'tooltip', property: 'letter-spacing', part: '' })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
    },
    [getCssVariableName({ component: 'tooltip', property: 'text-align', part: '' })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'tooltip', property: 'text-decoration', part: '' })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
    },
  };
};
