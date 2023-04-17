import { TooltipComponents, TooltipComponentTokens } from '../../../exporters/components/component_sets/tooltip';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaColorToCssColor,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';

enum Part {
  Tooltip  = 'tooltip',
}

/**
 * Transform tooltips into scss variants
 * @param tooltips
 * @returns
 */
export const transformTooltipComponentsToScssTypes = (tooltips: TooltipComponents): string => {
  const lines = [];
  lines.push(`/* At present there are no tooltip types*/`);
  return lines.join('\n\n') + '\n';
};

export const transformTooltipComponentTokensToScssVariables = ({ ...tokens }: TooltipComponentTokens): Record<string, ValueProperty> => {
  return {
    /**
     * Main part
     */
    // Background
    [getScssVariableName({ component: 'tooltip', part: '', property: 'background' })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'bg' })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'bg',
      group: Part.Tooltip,
    },
    // Padding
    [getScssVariableName({ component: 'tooltip', part: '', property: 'padding-y' })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'padding-x' })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'padding-top' })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'padding-right' })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'padding-bottom' })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'padding-left' })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part.Tooltip,
    },
    // Border
    [getScssVariableName({ component: 'tooltip', part: '', property: 'border-width' })]: {
      value: `${tokens.borderWeight}`,
      property: 'border-width',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'border-radius' })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'border-radius-sm' })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'border-radius-lg' })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'border-color' })]: {
      value: transformFigmaColorToCssColor(tokens.borderColor),
      property: 'border-color',
      group: Part.Tooltip,
    },
    // Font
    [getScssVariableName({ component: 'tooltip', part: '', property: 'font-family' })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'font-size' })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'font-weight' })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'line-height' })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'letter-spacing' })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'text-align' })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Part.Tooltip,
    },
    [getScssVariableName({ component: 'tooltip', part: '', property: 'text-decoration' })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part.Tooltip,
    },
  };
};
