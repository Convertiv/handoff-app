import { ValueProperty } from '../types';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents, getTypesFromComponents } from '../css/utils';
import { Component } from '../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
import { getTokenSetTransformer } from '../tokenSetTransformers';
import { normalizeVariableToken } from '../utils';

export const transformComponentsToScssTypes = (name: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const lines = [];

  const themes = getThemesFromComponents(components);
  const types = getTypesFromComponents(components);
  const states = getStatesFromComponents(components);
  const sizes = getSizesFromComponents(components);

  // Types
  if (types && types.length > 0) {
    lines.push(
      `$${name}-variants: ( ${types.map((type) => `"${type}"`).join(', ')});`
    );
  }
  
  // Sizes
  if (sizes && sizes.length > 0) {
    lines.push(
      `$${name}-sizes: ( ${sizes.map((type) => `"${normalizeVariableToken('size', type, options)}"`).join(', ')} );`
    );
  }

  // Themes
  if (themes && themes.length > 0) {
    lines.push(
      `$${name}-themes: ( ${themes.map((type) => `"${type}"`).join(', ')} );`
    );
  }
  
  // States
  if (states && states.length > 0) {
    lines.push(
      `$${name}-states: ( ${states.map((type) => `"${type == 'default' ? '' : type}"`).join(', ')} );`
    );
  }

  return lines.join('\n\n') + '\n';
}

export const transformComponentTokensToScssVariables = (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
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

      result = {...result, ...transformer('scss', component, part, tokenSet, options)}
    }
  }
  
  return result;
}