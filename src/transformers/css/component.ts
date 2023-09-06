import { Component } from '../../exporters/components/extractor';
import { formatComponentCodeBlockComment } from '../utils';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
import { transform } from '../transformer';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (componentId: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const lines = [];

  const componentCssClass = options?.cssRootClass ?? componentId;

  lines.push(`.${componentCssClass} {`)
  const cssVars = components.map((component) => `\t${formatComponentCodeBlockComment(component, '/**/')}\n${transformComponentTokensToCssVariables(component, options)
    .map(token => `\t${token.name}: ${token.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export const transformComponentTokensToCssVariables = (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions) => {
  return transform('css', component, options);
};