import { capitalize } from 'lodash';
import { AlertComponent, AlertComponents } from '../../../exporters/components/component_sets/alert';
import { ValueProperty } from '../types';
import {
  cssCodeBlockComment,
  getCssVariableName,
  getTypesFromComponents,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';

export const transformAlertComponentsToCssVariables = (alerts: AlertComponents): string => {
  const lines = [];
  lines.push(
    `$alert-variants: ( ${getTypesFromComponents(alerts)
      .map((type) => `"${type}"`)
      .join(', ')});`
  );
  lines.push('.alert {')
  const cssVars = alerts.map((alert) => `  ${cssCodeBlockComment('alert', alert)}\n ${Object.entries(transformAlertComponentTokensToCssVariables(alert))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}';
};

export const transformAlertComponentTokensToCssVariables = (tokens: AlertComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.layout;
  const theme = 'light';
  const state = 'default';

  return {
    // Background
    [getCssVariableName({ component: 'alert', property: 'background', part: '', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
    },

    // Padding
    [getCssVariableName({ component: 'alert', property: 'padding-top', part: '', theme, type, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'alert', property: 'padding-right', part: '', theme, type, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'alert', property: 'padding-bottom', part: '', theme, type, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'alert', property: 'padding-left', part: '', theme, type, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
    },

    // Border
    [getCssVariableName({ component: 'alert', property: 'border-width', part: '', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'alert', property: 'border-radius', part: '', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'alert', property: 'border-color', part: '', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
    },

    // Box shadow
    [getCssVariableName({ component: 'alert', property: 'box-shadow', part: '', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },

    // Spacing
    [getCssVariableName({ component: 'alert', property: 'spacing', part: '', theme, type, state })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing',
    },

    // Close part
    [getCssVariableName({ component: 'alert', property: 'color', part: 'close', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.close.color).color,
      property: 'color',
    },

    // Icon part
    [getCssVariableName({ component: 'alert', property: 'color', part: 'icon', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color',
    },

    // Body part
    [getCssVariableName({ component: 'alert', property: 'spacing', part: 'body', theme, type, state })]: {
      value: `${tokens.parts.body.spacing}px`,
      property: 'spacing',
    },

    // Content part
    [getCssVariableName({
      component: 'alert',
      property: 'spacing',
      part: 'content',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.content.spacing}px`, property: 'spacing' },

    // Title part
    [getCssVariableName({
      component: 'alert',
      property: 'font-family',
      part: 'title',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.title.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-size',
      part: 'title',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.title.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-weight',
      part: 'title',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.title.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'alert',
      property: 'line-height',
      part: 'title',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.title.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'alert',
      property: 'letter-spacing',
      part: 'title',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.title.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'alert', property: 'text-align', part: 'title', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.title.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'alert', property: 'text-decoration', part: 'title', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.title.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'alert', property: 'text-transform', part: 'title', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.title.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'alert', property: 'color', part: 'title', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.title.color).color,
      property: 'color',
    },

    // Text part
    [getCssVariableName({
      component: 'alert',
      property: 'font-family',
      part: 'text',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.text.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-size',
      part: 'text',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.text.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-weight',
      part: 'text',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.text.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'alert',
      property: 'line-height',
      part: 'text',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.text.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'alert',
      property: 'letter-spacing',
      part: 'text',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.text.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'alert', property: 'text-align', part: 'text', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'alert', property: 'text-decoration', part: 'text', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'alert', property: 'text-transform', part: 'text', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'alert', property: 'color', part: 'text', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.text.color).color,
      property: 'color',
    },

    // Actions part
    [getCssVariableName({
      component: 'alert',
      property: 'spacing',
      part: 'actions',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.actions.spacing}px`, property: 'margin-left' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-family',
      part: 'actions',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.actions.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-size',
      part: 'actions',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.actions.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'alert',
      property: 'font-weight',
      part: 'actions',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.actions.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'alert',
      property: 'line-height',
      part: 'actions',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.actions.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'alert',
      property: 'letter-spacing',
      part: 'actions',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.actions.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'alert', property: 'text-align', part: 'actions', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.actions.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'alert', property: 'text-decoration', part: 'actions', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.actions.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'alert', property: 'text-transform', part: 'actions', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.actions.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'alert', property: 'color', part: 'actions', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.actions.color).color,
      property: 'color',
    },
  };
};
