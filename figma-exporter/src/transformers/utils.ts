import { capitalize } from "lodash";
import { Component } from "../exporters/components/extractor";
import { ExportableTransformerOptions } from "../types";

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
  const { theme, type, state } = getReducedVariableNameTokens(component, options);
  
  const variableNameTemplate = variableType === 'css' ? options?.cssVariableTemplate : options?.scssVariableTemplate;
  const variableName = variableNameTemplate
    ? parseVariableNameTemplate(variableNameTemplate, component, part, property, options)
    : [
      component.name,
      type,
      normalizeVariablePart(part),
      theme,
      state,
      property,
    ].filter(Boolean).join('-');

    return variableType === 'css' ? `--${variableName}` : `$${variableName}`
};

export const normalizeVariableToken = (token: string, val?: string, options?: ExportableTransformerOptions) => {
  if (token in (options?.replace ?? {}) && val && val in (options?.replace[token] ?? {})) {
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

export const normalizeVariablePart = (part: string) => {
  return part === '$' ? '' : part.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}

const getReducedVariableNameTokens = (component: Component, options?: ExportableTransformerOptions) => {
  const theme = component.componentType === 'design' ? normalizeVariableToken('theme', (component.theme ?? ''), options) : undefined;

  const state = component.componentType === 'design'
    ? normalizeVariableToken('activity', (component.activity ?? undefined), options) ?? normalizeVariableToken('state', (component.state ?? undefined), options)
    : undefined;

  const type = component.componentType === 'design'
    ? (state && state === normalizeVariableToken('activity', (component.activity ?? ''), options) ? normalizeVariableToken('state', (component.state ?? ''), options) : normalizeVariableToken('type', (component.type ?? ''), options))
    : normalizeVariableToken('layout', (component.layout ?? undefined), options) ?? normalizeVariableToken('size', (component.size ?? undefined), options);

  return { theme, type, state }
}

const parseVariableNameTemplate = (template: string, component: Component, part: string, property: string, options?: ExportableTransformerOptions) => {
  return template
    .replaceAll('{$theme}', component.componentType === 'design' ? normalizeVariableToken('theme', (component.theme ?? ''), options) ?? '' : '')
    .replaceAll('{$type}', component.componentType === 'design' ? normalizeVariableToken('type', (component.type ?? ''), options) ?? '' : '')
    .replaceAll('{$state}', component.componentType === 'design' ? normalizeVariableToken('state', (component.state ?? ''), options) ?? '' : '')
    .replaceAll('{$activity}', component.componentType === 'design' ? normalizeVariableToken('activity', (component.activity ?? ''), options) ?? '' : '')
    .replaceAll('{$layout}', component.componentType === 'layout' ? normalizeVariableToken('layout', (component.layout ?? ''), options) ?? '' : '')
    .replaceAll('{$size}', component.componentType === 'layout' ? normalizeVariableToken('size', (component.size ?? ''), options) ?? '' : '')
    .replaceAll('{$part}', normalizeVariablePart(part))
    .replaceAll('{$property}', property)
    .replace(/-+/g, '-')
}