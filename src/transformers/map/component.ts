import { transform } from '../transformer';
import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from '../../types/config';
import { normalizeTokenNamePartValue, } from '../utils';
import * as Utils from '../../utils/index';

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

export const transformComponentsToVariantsMap = (component: FileComponentObject, options?: IntegrationObjectComponentOptions) => {
  const result: { [variantProp: string]: Set<string> } = {};

  component.instances.forEach((instance) => {
    instance.variantProperties.forEach(([variantProp, value]) => {
      if (value) {
        result[Utils.slugify(variantProp)] ??= new Set<string>();
        result[Utils.slugify(variantProp)].add(Utils.slugify(normalizeTokenNamePartValue(variantProp, value, options, true)));
      }
    });
  });

  return Object.keys(result).reduce((acc, key) => {
    // Convert each Set<string> to an array
    acc[key] = Array.from(result[key]);
    return acc;
  }, {} as { [variantProp: string]: string[] });
};