import { capitalize } from 'lodash';
import { PaginationComponent, PaginationComponents } from '../../../exporters/components/component_sets/pagination';
import { ValueProperty } from '../types';
import {
  cssCodeBlockComment,
  getCssVariableName,
  getSizesFromComponents,
  getStatesFromComponents,
  getThemesFromComponents,
  getTypesFromComponents,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';

export const transformPaginationComponentsToCssVariables = (pagination: PaginationComponents): string => {
  const lines = [];
  lines.push(
    `$pagination-sizes: ( ${getSizesFromComponents(pagination)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$pagination-themes: ( ${getThemesFromComponents(pagination)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$pagination-states: ( ${getStatesFromComponents(pagination)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  lines.push('.pagination {')
  const cssVars = pagination.map((page) => `  ${cssCodeBlockComment('pagination', page)}\n ${Object.entries(transformPaginationComponentTokensToCssVariables(page))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}';
};

export const transformPaginationComponentTokensToCssVariables = (tokens: PaginationComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? 'default' : tokens.size;
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    // Background
    [getCssVariableName({ component: 'pagination', property: 'background', theme, type, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },

    // Border
    [getCssVariableName({ component: 'pagination', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'pagination', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'pagination', property: 'border-color', theme, type, state })]: {
      value: tokens.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },

    // Spacing
    [getCssVariableName({ component: 'pagination', property: 'spacing', theme, type, state })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing',
    },

    // Previous part
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'background',
      theme,
      type,
      state,
    })]: {
      value: tokens.parts.previous.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-width',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.borderWeight}px`, property: 'border-width' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-radius',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.borderRadius}px`, property: 'border-radius' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-color',
      theme,
      type,
      state,
    })]: {
      value: tokens.parts.previous.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-top',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingTop}px`, property: 'padding-top' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-right',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingRight}px`, property: 'padding-right' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-bottom',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingBottom}px`, property: 'padding-bottom' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-left',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingLeft}px`, property: 'padding-left' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.previous.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'pagination', part: 'previous', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.previous.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'pagination', part: 'previous', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.previous.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'pagination', part: 'previous', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.previous.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'pagination', part: 'previous', property: 'color', theme, type, state })]: {
      value: tokens.parts.previous.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },

    // Next part
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'background',
      theme,
      type,
      state,
    })]: {
      value: tokens.parts.next.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-width',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.borderWeight}px`, property: 'border-width' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-radius',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.borderRadius}px`, property: 'border-radius' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-color',
      theme,
      type,
      state,
    })]: {
      value: tokens.parts.next.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-top',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingTop}px`, property: 'padding-top' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-right',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingRight}px`, property: 'padding-right' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-bottom',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingBottom}px`, property: 'padding-bottom' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-left',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingLeft}px`, property: 'padding-left' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.next.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'pagination', part: 'next', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.next.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'pagination', part: 'next', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.next.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'pagination', part: 'next', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.next.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'pagination', part: 'next', property: 'color', theme, type, state })]: {
      value: tokens.parts.next.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },

    // Item part
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'background',
      theme,
      type,
      state,
    })]: {
      value: tokens.parts.item.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-width',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.borderWeight}px`, property: 'border-width' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-radius',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.borderRadius}px`, property: 'border-radius' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-color',
      theme,
      type,
      state,
    })]: {
      value: tokens.parts.item.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-top',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingTop}px`, property: 'padding-top' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-right',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingRight}px`, property: 'padding-right' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-bottom',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingBottom}px`, property: 'padding-bottom' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-left',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingLeft}px`, property: 'padding-left' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.item.fontFamily}'`, property: 'font-family' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.fontSize}px`, property: 'font-size' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.fontWeight}`, property: 'font-weight' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.lineHeight}`, property: 'line-height' },
    [getCssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.letterSpacing}px`, property: 'letter-spacing' },
    [getCssVariableName({ component: 'pagination', part: 'item', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.item.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'pagination', part: 'item', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.item.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'pagination', part: 'item', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.item.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'pagination', part: 'item', property: 'color', theme, type, state })]: {
      value: tokens.parts.item.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },
  };
};
