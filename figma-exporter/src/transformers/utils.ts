import { capitalize } from "lodash";
import { Component } from "../exporters/components/extractor";
import { ExportableTransformerOptions } from "../types";
import { mapComponentSize } from "../utils/config";

/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
export const formatComponentCodeBlockComment = (type: string, component: Component, format: "/**/" | "//"): string => {
  let str = type;

  if (component.componentType === 'design') {
    str = (component.type !== undefined) ? `${capitalize(component.type)} ${str}` : `${capitalize(str)}`;
    str += (component.theme !== undefined) ? `, theme: ${component.theme}` : ``;
    str += (component.state !== undefined) ? `, state: ${component.state}` : ``;
    str += (component.activity !== undefined) ? `, activity: ${component.activity}` : ``;
  }

  if (component.componentType === 'layout') {
    str = `${capitalize(str)}`;
    str += (component.layout !== undefined) ? `, layout: ${component.layout}` : ``;
    str += (component.size !== undefined) ? `, size: ${component.size}` : ``;
  }

  return format === "/**/" ? `/* ${str} */` : `// ${str}`
}

export const formatVariableName = (variableType: 'css' | 'scss', component: Component, part: string, property: string, options?: ExportableTransformerOptions): string => {
  const { theme = 'light', type = 'default', state = 'default' } = getReducedVariableNameTokens(component);
  
  const variableNameTemplate = variableType === 'css' ? options?.cssVariableTemplate : options?.scssVariableTemplate;
  const variableName = variableNameTemplate
    ? parseVariableNameTemplate(variableNameTemplate, component, part, property, options)
    : [
      component.name,
      normalizeVariableToken('type', type, options),
      normalizeVariablePart(part),
      normalizeVariableToken('theme', theme, options),
      normalizeVariableToken('state', state, options),
      property,
    ].filter(Boolean).join('-');

    return variableType === 'css' ? `--${variableName}` : `$${variableName}`
};

const getReducedVariableNameTokens = (component: Component) => {
  const theme = component.componentType === 'design' ? component.theme : undefined;

  const state = component.componentType === 'design'
    ? component.activity ?? component.state
    : undefined;

  const type = component.componentType === 'design'
    ? (state && state === component.activity ? component.state : component.type)
    : component.layout ?? mapComponentSize(component.size ?? '', component.name);

  return { theme, type, state }
}

const parseVariableNameTemplate = (template: string, component: Component, part: string, property: string, options?: ExportableTransformerOptions) => {
  return template
    .replaceAll('{$theme}', component.componentType === 'design' ? normalizeVariableToken('theme', (component.theme ?? ''), options) : '')
    .replaceAll('{$type}', component.componentType === 'design' ? normalizeVariableToken('type', (component.type ?? ''), options) : '')
    .replaceAll('{$state}', component.componentType === 'design' ? normalizeVariableToken('state', (component.state ?? ''), options) : '')
    .replaceAll('{$activity}', component.componentType === 'design' ? normalizeVariableToken('activity', (component.activity ?? ''), options) : '')
    .replaceAll('{$layout}', component.componentType === 'layout' ? normalizeVariableToken('layout', (component.layout ?? ''), options) : '')
    .replaceAll('{$size}', component.componentType === 'layout' ? normalizeVariableToken('size', (component.size ?? ''), options) : '')
    .replaceAll('{$part}', normalizeVariablePart(part))
    .replaceAll('{$property}', property)
    .replace(/-+/g, '-')
}

const normalizeVariableToken = (token: string, val: string, options?: ExportableTransformerOptions) => {
  if (token in (options?.replace ?? {}) && val in (options?.replace[token] ?? {})) {
    return options?.replace[token][val] ?? '';
  }

  if (token === 'theme' && val === 'light') {
    return '';
  }
  
  if (['type', 'state', 'activity'].includes(token) && val === 'default') {
    return '';
  }

  return val;
}

const normalizeVariablePart = (part: string) => {
  return part === '$' ? '' : part.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}