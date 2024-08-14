import { transform } from '../transformer';
import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from 'handoff/types/config';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToMap = (
  _: string,
  component: FileComponentObject,
  integrationOptions: IntegrationObjectComponentOptions
) => {
  const map = {} as Record<string, string>;

  component.instances.forEach((instance) => {
    const tokens = transform('map', instance, integrationOptions);

    tokens.forEach((token) => {
      map[token.name] = token.value;
    });
  });

  return map;
};
