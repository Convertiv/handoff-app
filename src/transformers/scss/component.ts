import { normalizeTokenNamePartValue } from '../utils';
import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { transform } from '../transformer';
import { slugify } from '../../utils';
import { IntegrationObjectComponentOptions } from '../../types/config';

export const transformComponentsToScssTypes = (
  name: string,
  component: FileComponentObject,
  options?: IntegrationObjectComponentOptions
): string => {
  const result: { [variantProp: string]: Set<string> } = {};

  component.instances.forEach((instance) => {
    instance.variantProperties.forEach(([variantProp, value]) => {
      if (value) {
        result[variantProp] ??= new Set<string>();
        result[variantProp].add(normalizeTokenNamePartValue(variantProp, value, options, true));
      }
    });
  });

  return (
    Object.keys(result)
      .map((variantProp) => {
        const mapValsStr = Array.from(result[variantProp])
          .map((val) => `"${val}"`)
          .join(', ');
        return `$${name}-${slugify(variantProp)}-map: ( ${mapValsStr} );`;
      })
      .join('\n\n') + '\n'
  );
};

export const transformComponentTokensToScssVariables = (component: ComponentInstance, options?: IntegrationObjectComponentOptions) => {
  return transform('scss', component, options);
};
