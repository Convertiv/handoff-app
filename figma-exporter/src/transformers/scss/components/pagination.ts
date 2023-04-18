import { PaginationComponent, PaginationComponents } from '../../../exporters/components/component_sets/pagination';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents } from '../../css/utils';
import { mapComponentSize } from '../../../utils/config';

/**
 * Generate SCSS variants from pagination component
 * @param pagination
 * @returns
 */
export const transformPaginationComponentsToScssTypes = (pagination: PaginationComponents): string => {
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
  return lines.join('\n\n') + '\n';
};


export const transformPaginationComponentTokensToScssVariables = (tokens: PaginationComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? 'default' : mapComponentSize(tokens.size, 'pagination');
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    // Background
    [getScssVariableName({ component: 'pagination', property: 'background', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
    },

    // Border
    [getScssVariableName({ component: 'pagination', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getScssVariableName({ component: 'pagination', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getScssVariableName({ component: 'pagination', property: 'border-color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
    },

    // Spacing
    [getScssVariableName({ component: 'pagination', property: 'spacing', theme, type, state })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing',
    },

    // Previous part
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'background',
      theme,
      type,
      state,
    })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.previous.background).color,
      property: 'background',
    },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-width',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.borderWeight}px`, property: 'border-width' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-radius',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.borderRadius}px`, property: 'border-radius' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'border-color',
      theme,
      type,
      state,
    })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.previous.borderColor).color,
      property: 'border-color',
    },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-top',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingTop}px`, property: 'padding-top' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-right',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingRight}px`, property: 'padding-right' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-bottom',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingBottom}px`, property: 'padding-bottom' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'padding-left',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.paddingLeft}px`, property: 'padding-left' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.previous.fontFamily}'`, property: 'font-family' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.fontSize}px`, property: 'font-size' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.fontWeight}`, property: 'font-weight' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.lineHeight}`, property: 'line-height' },
    [getScssVariableName({
      component: 'pagination',
      part: 'previous',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.previous.letterSpacing}px`, property: 'letter-spacing' },
    [getScssVariableName({ component: 'pagination', part: 'previous', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.previous.textAlign),
      property: 'text-align',
    },
    [getScssVariableName({ component: 'pagination', part: 'previous', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.previous.textCase),
      property: 'text-transform',
    },
    [getScssVariableName({ component: 'pagination', part: 'previous', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.previous.textDecoration),
      property: 'text-decoration',
    },
    [getScssVariableName({ component: 'pagination', part: 'previous', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.previous.color).color,
      property: 'color',
    },

    // Next part
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'background',
      theme,
      type,
      state,
    })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.next.background).color,
      property: 'background',
    },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-width',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.borderWeight}px`, property: 'border-width' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-radius',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.borderRadius}px`, property: 'border-radius' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'border-color',
      theme,
      type,
      state,
    })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.next.borderColor).color,
      property: 'border-color',
    },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-top',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingTop}px`, property: 'padding-top' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-right',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingRight}px`, property: 'padding-right' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-bottom',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingBottom}px`, property: 'padding-bottom' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'padding-left',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.paddingLeft}px`, property: 'padding-left' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.next.fontFamily}'`, property: 'font-family' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.fontSize}px`, property: 'font-size' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.fontWeight}`, property: 'font-weight' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.lineHeight}`, property: 'line-height' },
    [getScssVariableName({
      component: 'pagination',
      part: 'next',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.next.letterSpacing}px`, property: 'letter-spacing' },
    [getScssVariableName({ component: 'pagination', part: 'next', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.next.textAlign),
      property: 'text-align',
    },
    [getScssVariableName({ component: 'pagination', part: 'next', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.next.textCase),
      property: 'text-transform',
    },
    [getScssVariableName({ component: 'pagination', part: 'next', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.next.textDecoration),
      property: 'text-decoration',
    },
    [getScssVariableName({ component: 'pagination', part: 'next', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.next.color).color,
      property: 'color',
    },

    // Item part
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'background',
      theme,
      type,
      state,
    })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.item.background).color,
      property: 'background',
    },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-width',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.borderWeight}px`, property: 'border-width' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-radius',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.borderRadius}px`, property: 'border-radius' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'border-color',
      theme,
      type,
      state,
    })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.item.borderColor).color,
      property: 'border-color',
    },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-top',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingTop}px`, property: 'padding-top' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-right',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingRight}px`, property: 'padding-right' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-bottom',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingBottom}px`, property: 'padding-bottom' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'padding-left',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.paddingLeft}px`, property: 'padding-left' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-family',
      theme,
      type,
      state,
    })]: { value: `'${tokens.parts.item.fontFamily}'`, property: 'font-family' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-size',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.fontSize}px`, property: 'font-size' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'font-weight',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.fontWeight}`, property: 'font-weight' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'line-height',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.lineHeight}`, property: 'line-height' },
    [getScssVariableName({
      component: 'pagination',
      part: 'item',
      property: 'letter-spacing',
      theme,
      type,
      state,
    })]: { value: `${tokens.parts.item.letterSpacing}px`, property: 'letter-spacing' },
    [getScssVariableName({ component: 'pagination', part: 'item', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.item.textAlign),
      property: 'text-align',
    },
    [getScssVariableName({ component: 'pagination', part: 'item', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.item.textCase),
      property: 'text-transform',
    },
    [getScssVariableName({ component: 'pagination', part: 'item', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.item.textDecoration),
      property: 'text-decoration',
    },
    [getScssVariableName({ component: 'pagination', part: 'item', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.item.color).color,
      property: 'color',
    },
  };
};
