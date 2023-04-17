import { CheckboxComponent, CheckboxComponents } from '../../../exporters/components/component_sets/checkbox';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { cssCodeBlockComment, getSizesFromComponents, getStatesFromComponents, getThemesFromComponents, transformFigmaColorToCssColor } from '../utils';
import {mapComponentSize} from '../../../utils/config';

/**
 * Transform checkbox tokens into CSS variables
 * @param checkboxes
 * @returns
 */
export const transformCheckboxComponentsToCssVariables = (checkboxes: CheckboxComponents): string => {
  const lines = [];
  lines.push('.checkbox {')
  const cssVars = checkboxes.map((checkbox) => `  ${cssCodeBlockComment('checkbox', checkbox)}\n ${Object.entries(transformCheckboxComponentTokensToCssVariables(checkbox))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};


export const transformCheckboxComponentTokensToCssVariables = (tokens: CheckboxComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.state : mapComponentSize(tokens.size);
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';

  return {
    /**
     * Checkbox part
     */
    // Button background
    [getCssVariableName({ component: 'checkbox', property: 'background', part: '', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.background).color,
      property: 'background',
    },
    // Size
    [getCssVariableName({ component: 'checkbox', property: 'width', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'checkbox', property: 'width-raw', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'checkbox', property: 'height', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'checkbox', property: 'height-raw', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw',
    },
    // Icon color
    [getCssVariableName({ component: 'checkbox', property: 'icon-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.color).color,
      property: 'icon-color',
    },
    // Opacity
    [getCssVariableName({ component: 'checkbox', property: 'opacity', type, theme, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
    },
    // Padding
    [getCssVariableName({ component: 'checkbox', property: 'padding-y', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'vertical padding',
    },
    [getCssVariableName({ component: 'checkbox', property: 'padding-x', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'horizontal padding',
    },
    [getCssVariableName({ component: 'checkbox', property: 'padding-top', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'top padding',
    },
    [getCssVariableName({ component: 'checkbox', property: 'padding-right', type, theme, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'right padding',
    },
    [getCssVariableName({ component: 'checkbox', property: 'padding-bottom', type, theme, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'bottom padding',
    },
    [getCssVariableName({ component: 'checkbox', property: 'padding-left', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'left padding',
    },
    [getCssVariableName({ component: 'checkbox', property: 'padding-start', type, theme, state })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'checkbox left padding',
    },
    // Border
    [getCssVariableName({ component: 'checkbox', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border width',
    },
    [getCssVariableName({ component: 'checkbox', property: 'border-radius', type, theme, state })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border radius',
    },
    [getCssVariableName({ component: 'checkbox', property: 'border-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border color',
    },
    // Box shadow
    [getCssVariableName({ component: 'checkbox', property: 'box-shadow', type, theme, state })]: {
      value: tokens.parts.check.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box shadow',
    },
    /**
     * Icon part
     */
    // Size
    [getCssVariableName({ component: 'checkbox', part: 'icon', property: 'width', type, theme, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'checkbox', part: 'icon', property: 'width-raw', type, theme, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'checkbox', part: 'icon', property: 'height', type, theme, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'checkbox', part: 'icon', property: 'height-raw', type, theme, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw',
    },
    /**
     * Label part
     */
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font family',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font size',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font weight',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line height',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter spacing',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text alignment',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text decoration',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text transformation',
    },
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'text color',
    },
    // Opacity
    [getCssVariableName({ component: 'checkbox', part: 'label', property: 'opacity', type, theme, state })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
    },
  };
};


