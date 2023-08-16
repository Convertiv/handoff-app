import { Component } from '../../exporters/components/extractor';
import { transform } from '../transformer';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToStyleDictionary = (_: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const sd = {} as any;

  components.forEach(component => {
    const tokens = transform('sd', component, options);

    Object.entries(tokens).forEach(([_, token]) =>{
      const propPath = token.metadata.propertyPath;
      const lastIdx = propPath.length - 1;
      let ref = sd;

      propPath.forEach((el, idx) => {
        if (idx === lastIdx) {
          return;
        }

        ref[el] ??= {};
        ref = ref[el];
      });

      const propParts = propPath[lastIdx].split('-');

      propParts.forEach(el => {
        ref[el] ??= {};
        ref = ref[el];
      });

      ref['value'] = token.value;
    });
  })

  return JSON.stringify(sd, null, 2);
};