import { Token } from '../types';
import { getComponentVariantPropertiesAsMap, normalizeTokenNamePartValue } from '../utils';
import { Component } from '../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
import { transform } from '../transformer';
import { slugify } from '../../utils';

export const transformComponentsToScssTypes = (name: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const result: { [variantProp: string]: Set<string> } = {};

  components.forEach(component => {
    const componentVariantProps = getComponentVariantPropertiesAsMap(component);
    componentVariantProps.forEach((value, variantProp) => {
      if (value) {
        result[variantProp] ??= new Set<string>();
        result[variantProp].add(component.type === 'design'
          ? normalizeTokenNamePartValue(variantProp, value, options, true)
          : normalizeTokenNamePartValue(variantProp, value, options, true)
        );
      }
    });
  });

  return Object.keys(result).map(variantProp => {
    const mapValsStr = Array.from(result[variantProp]).map((val) => `"${val}"`).join(', ');
    return `$${name}-${slugify(variantProp)}-map: ( ${mapValsStr} );`
  }).join('\n\n') + '\n';
}

export const transformComponentTokensToScssVariables = (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, Token> => {
  return transform('scss', component, options);
}