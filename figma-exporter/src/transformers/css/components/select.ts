import { SelectComponent, SelectComponents } from '../../../exporters/components/component_sets/select';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { cssCodeBlockComment } from '../utils';

/**
 * Transform Select component to css vars
 * @param selects
 * @returns
 */
export const transformSelectComponentsToCssVariables = (selects: SelectComponents): string => {
  const lines = [];
  lines.push('.select {');
  const cssVars = selects.map(
    (select) =>
      `  ${cssCodeBlockComment('select', select)}\n ${Object.entries(transformSelectComponentTokensToCssVariables(select))
        .map(([variable, value]) => `  ${variable}: ${value.value};`)
        .join('\n')}`
  );
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Transform Select Components into CSS variables
 * @param tokens
 * @returns
 */
export const transformSelectComponentTokensToCssVariables = (tokens: SelectComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? 'default' : tokens.size;
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    // Background
    [getCssVariableName({ component: 'select', property: 'background', theme, type, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },

    // Padding
    [getCssVariableName({ component: 'select', property: 'padding-top', theme, type, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'select', property: 'padding-right', theme, type, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'select', property: 'padding-bottom', theme, type, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'select', property: 'padding-left', theme, type, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
    },

    // Border
    [getCssVariableName({ component: 'select', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'select', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'select', property: 'border-color', theme, type, state })]: {
      value: tokens.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },

    // Box shadow
    [getCssVariableName({ component: 'select', property: 'box-shadow', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },

    // Label part
    [getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.label.spacing}px`, property: 'margin-bottom' },
    [getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.label.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.label.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.label.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.label.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'select',
      part: 'label',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.label.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'select', part: 'label', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'select', part: 'label', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'select', part: 'label', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'select', part: 'label', property: 'color', theme, type, state })]: {
      value: tokens.parts.label.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },

    // Option part
    [getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.option.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.option.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.option.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.option.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'select',
      part: 'option',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.option.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'select', property: 'text-align', part: 'option', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.option.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'select', property: 'text-transform', part: 'option', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.option.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'select', property: 'text-decoration', part: 'option', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.option.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'select', property: 'color', part: 'option', theme, type, state })]: {
      value: tokens.parts.option.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },

    // Icon part
    [getCssVariableName({ component: 'select', part: 'icon', property: 'width', theme, type, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'select', part: 'icon', property: 'width-raw', theme, type, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'select', part: 'icon', property: 'height', theme, type, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'select', part: 'icon', property: 'height-raw', theme, type, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw',
    },
    [getCssVariableName({ component: 'select', part: 'icon', property: 'color', theme, type, state })]: {
      value: tokens.parts.icon.color.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'color',
    },

    // Additional info part
    [getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.additionalInfo.spacing}px`, property: 'spacing' },
    [getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.additionalInfo.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.additionalInfo.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.additionalInfo.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.additionalInfo.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'select',
      part: 'additional-info',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.additionalInfo.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'select', property: 'text-align', part: 'additional-info', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.additionalInfo.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'select', property: 'text-transform', part: 'additional-info', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.additionalInfo.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'select', property: 'text-decoration', part: 'additional-info', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.additionalInfo.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'select', property: 'color', part: 'additional-info', theme, type, state })]: {
      value: tokens.parts.additionalInfo.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },
  };
};
