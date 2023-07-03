import { Component } from '../../exporters/components/extractor';
import { transformComponentTokens } from '../utils';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToStyleDictionary = (_: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions): string => {
  const sd = {} as any;
  const tokenNamePartSeparator = '//'; // TODO: Temp

  components.forEach(component => {
    Object.entries(transformComponentTokens(component, options)).forEach(([tokenName, tokenValue]) =>{
      const path = tokenName.split(tokenNamePartSeparator); // TODO: Improve/remove by returning the property name structure?
      const lastIdx = path.length - 1;

      let ref = sd;
      path.forEach((el, idx) => {
        if (idx === lastIdx) {
          return;
        }

        ref[el] ??= {};
        ref = ref[el];
      });

      const propParts = path[lastIdx].split('-');
      propParts.forEach(el => {
        ref[el] ??= {};
        ref = ref[el];
      });


      ref['value'] = tokenValue.value;
    });
  })

  return JSON.stringify(sd, null, 2);
};