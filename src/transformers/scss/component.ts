import { ValueProperty } from '../types';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents, getTypesFromComponents, normalizeTokenNameVariableValue } from '../utils';
import { Component } from '../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
import { transform } from '../transformer';

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
      `$${name}-sizes: ( ${sizes.map((type) => `"${normalizeTokenNameVariableValue('size', type, options)}"`).join(', ')} );`
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
  return transform('scss', component, options);
}