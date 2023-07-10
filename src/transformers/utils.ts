import capitalize from 'lodash/capitalize.js';
import { Component } from '../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import { TokenType, AbstractComponent } from './types';
import { filterOutUndefined } from '../utils';
import { tokenNamePropertyPathPartsSeparator } from './constants';

export const getTypesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.type).filter(filterOutUndefined)));
};

export const getStatesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.state).filter(filterOutUndefined)));
};

export const getThemesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.theme).filter(filterOutUndefined)));
};

export const getSizesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components.map((component) => component.size).filter(filterOutUndefined)));
};

/**
 * Generates a standardized component comment block.
 *
 * @param type
 * @param component
 * @returns
 */
export const formatComponentCodeBlockComment = (type: string, component: Component, format: '/**/' | '//'): string => {
  let str = type;

  if (component.componentType === 'design') {
    str = component.type !== undefined ? `${capitalize(component.type)} ${str}` : `${capitalize(str)}`;
    str += component.theme !== undefined ? `, theme: ${component.theme}` : ``;
    str += component.state !== undefined ? `, state: ${component.state}` : ``;
    str += component.activity !== undefined ? `, activity: ${component.activity}` : ``;
  }

  if (component.componentType === 'layout') {
    str = `${capitalize(str)}`;
    str += component.layout !== undefined ? `, layout: ${component.layout}` : ``;
    str += component.size !== undefined ? `, size: ${component.size}` : ``;
  }

  return format === '/**/' ? `/* ${str} */` : `// ${str}`;
};

/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
export const formatTokenName = (
  tokenType: TokenType,
  component: Component,
  part: string,
  property: string,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): string => {
  // Only CSS and SCSS token types support templates
  const tokenNameTemplate =
    tokenType === 'css' ? options?.cssVariableTemplate : tokenType === 'scss' ? options?.scssVariableTemplate : null;

  const variableName = tokenNameTemplate
    ? parseTokenNameTemplate(tokenNameTemplate, component, part, property, options)
    : getReducedTokenName(component, part, property, options);

  if (tokenType === 'css') {
    return `--${variableName}`;
  }

  if (tokenType === 'scss') {
    return `$${variableName}`;
  }

  return variableName;
};

export const getReducedTokenName = (
  component: Component,
  part: string,
  property: string,
  options?: ExportableTransformerOptions & ExportableSharedOptions
) => {
  return getReducedTokenPropertyPath(component, part, property, options).join(tokenNamePropertyPathPartsSeparator);
};

/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the exportable
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the exportable shared options.
 *
 * @param variable
 * @param value
 * @param options
 * @returns
 */
export const normalizeTokenNameVariableValue = (
  variable: string,
  value?: string,
  options?: ExportableTransformerOptions & ExportableSharedOptions
) => {
  const replace = options?.replace ?? {};
  const defaults = options?.defaults ?? {};

  if (variable in (replace ?? {}) && value && value in (replace[variable] ?? {})) {
    return replace[variable][value] ?? '';
  }

  if (variable in (defaults ?? {}) && value === (defaults[variable as keyof typeof defaults] ?? '')) {
    return '';
  }

  return value;
};

export const getTokenMetadata = (
  component: Component,
  part: string,
  options?: ExportableTransformerOptions & ExportableSharedOptions
) => {
  const state =
    component.componentType === 'design'
      ? normalizeTokenNameVariableValue('state', component.state ?? undefined, options)
      : undefined;
  const activity =
      component.componentType === 'design'
        ? normalizeTokenNameVariableValue('activity', component.activity ?? undefined, options)
        : undefined;

  const theme = component.componentType === 'design' ? normalizeTokenNameVariableValue('theme', component.theme ?? '', options) : undefined;
  const layout =
    component.componentType === 'design' ? '' : normalizeTokenNameVariableValue('layout', component.layout ?? undefined, options);
  const size = component.componentType === 'design' ? '' : normalizeTokenNameVariableValue('size', component.size ?? undefined, options);

  return {
    name: component.name,
    type: component.componentType,
    variant: component.componentType === 'design' ? component.type ?? '' : '',
    state: state ?? '',
    theme: theme ?? '',
    layout: layout ?? '',
    size: size ?? '',
    activity: activity ?? '',
    part: normalizeComponentPartName(part),
  };
};

/**
 * Reduces the number of the token name parts to just 3 items.
 *
 * @param component
 * @param options
 * @returns
 */
export const getReducedTokenPropertyPath = (
  component: Component,
  part: string,
  property: string,
  options?: ExportableTransformerOptions & ExportableSharedOptions
) => {
  const l3 =
    component.componentType === 'design'
      ? normalizeTokenNameVariableValue('activity', component.activity ?? undefined, options) ??
        normalizeTokenNameVariableValue('state', component.state ?? undefined, options)
      : undefined;

  const l2 = component.componentType === 'design' ? normalizeTokenNameVariableValue('theme', component.theme ?? '', options) : undefined;

  const l1 =
    component.componentType === 'design'
      ? l3 && l3 === normalizeTokenNameVariableValue('activity', component.activity ?? '', options)
        ? normalizeTokenNameVariableValue('state', component.state ?? '', options)
        : normalizeTokenNameVariableValue('type', component.type ?? '', options)
      : normalizeTokenNameVariableValue('layout', component.layout ?? undefined, options) ??
        normalizeTokenNameVariableValue('size', component.size ?? undefined, options);

  return [component.name, l1 ?? '', normalizeComponentPartName(part), l2 ?? '', l3 ?? '', property].filter((part) => part !== '');
};

const parseTokenNameTemplate = (
  template: string,
  component: Component,
  part: string,
  property: string,
  options?: ExportableTransformerOptions & ExportableSharedOptions
) => {
  return template
    .replaceAll(
      '{$theme}',
      component.componentType === 'design' ? normalizeTokenNameVariableValue('theme', component.theme ?? '', options) ?? '' : ''
    )
    .replaceAll(
      '{$type}',
      component.componentType === 'design' ? normalizeTokenNameVariableValue('type', component.type ?? '', options) ?? '' : ''
    )
    .replaceAll(
      '{$state}',
      component.componentType === 'design' ? normalizeTokenNameVariableValue('state', component.state ?? '', options) ?? '' : ''
    )
    .replaceAll(
      '{$activity}',
      component.componentType === 'design' ? normalizeTokenNameVariableValue('activity', component.activity ?? '', options) ?? '' : ''
    )
    .replaceAll(
      '{$layout}',
      component.componentType === 'layout' ? normalizeTokenNameVariableValue('layout', component.layout ?? '', options) ?? '' : ''
    )
    .replaceAll(
      '{$size}',
      component.componentType === 'layout' ? normalizeTokenNameVariableValue('size', component.size ?? '', options) ?? '' : ''
    )
    .replaceAll('{$part}', normalizeComponentPartName(part))
    .replaceAll('{$property}', property)
    .replace(/-+/g, '-');
};

const normalizeComponentPartName = (part: string) => {
  return part === '$' ? '' : part.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
};
