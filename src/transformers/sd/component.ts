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

    tokens.forEach(token =>{
      const tokenNameSegments = token.metadata.nameSegments;
      const lastIdx = tokenNameSegments.length - 1;
      let ref = sd;

      tokenNameSegments.forEach((tokenNameSegment, idx) => {
        if (idx === lastIdx) {
          return;
        }

        ref[tokenNameSegment] ??= {};
        ref = ref[tokenNameSegment];
      });

      const propParts = tokenNameSegments[lastIdx].split('-');

      propParts.forEach(el => {
        ref[el] ??= {};
        ref = ref[el];
      });

      ref['value'] = token.value;
    });
  })

  return JSON.stringify(sd, null, 2);
};