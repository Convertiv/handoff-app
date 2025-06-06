import { transform } from '../transformer';
import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from '../../types/config';
import { tokenReferenceFormat } from '../css/component';
import Handoff from '../../index';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToStyleDictionary = (
  _: string,
  component: FileComponentObject,
  handoff: Handoff,
  integrationOptions?: IntegrationObjectComponentOptions
): string => {
  const sd = {} as any;

  component.instances.forEach((instance) => {
    const tokens = transform('sd', instance, integrationOptions);

    tokens.forEach((token) => {
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

      propParts.forEach((el) => {
        ref[el] ??= {};
        ref = ref[el];
      });

      ref['value'] = tokenReferenceFormat(token, 'sd', handoff);
    });
  });

  return JSON.stringify(sd, null, 2);
};
