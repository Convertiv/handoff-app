import { transform } from '../transformer';
import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from 'handoff/types/config';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToStyleDictionary = (
  _: string,
  component: FileComponentObject,
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

      ref['value'] = token.value;
    });
  });

  return JSON.stringify(sd, null, 2);
};
