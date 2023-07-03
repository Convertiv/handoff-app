import { ValueProperty } from '../types';
import { Component } from '../../exporters/components/extractor';
import { formatComponentCodeBlockComment } from '../utils';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
import { getTokenSetTransformer } from '../tokenSetTransformers';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (componentName: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const lines = [];

  const componentCssClass = options?.rootCssClass ?? componentName;
  
  lines.push(`.${componentCssClass} {`)
  const cssVars = components.map((component) => `\t${formatComponentCodeBlockComment(componentName, component, '/**/')}\n${Object.entries(transformComponentTokensToCssVariables(component, options))
    .map(([variable, value]) => `\t${variable.replaceAll('//', '-')}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export const transformComponentTokensToCssVariables = (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  let result = {};

  for (const part in component.parts) {
    const tokenSets = component.parts[part];

    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }

    for (const tokenSet of tokenSets) {
      const transformer = getTokenSetTransformer(tokenSet);

      if (!transformer) {
        continue;
      }

      result = {...result, ...transformer('css', component, part, tokenSet, options)}
    }
  }
  
  return result;
};