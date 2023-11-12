import { Component } from '../../exporters/components/extractor';
import { transform } from '../transformer';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToMap = (_: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const map = {} as any;

  components.forEach(component => {
    const tokens = transform('map', component, options);

    tokens.forEach(token =>{
      map[token.name] = token.value;
    });
  })

  return JSON.stringify(map, null, 2);
};