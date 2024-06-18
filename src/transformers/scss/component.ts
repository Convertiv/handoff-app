import { normalizeTokenNamePartValue } from '../utils.js';
import { ComponentInstance, FileComponentObject } from '../../exporters/components/types.js';
import { ComponentDefinitionOptions } from '../../types.js';
import { transform } from '../transformer.js';
import { slugify } from '../../utils/index.js';

export const transformComponentsToScssTypes = (name: string, component: FileComponentObject): string => {
  const result: { [variantProp: string]: Set<string> } = {};

  component.instances.forEach((instance) => {
    instance.variantProperties.forEach(([variantProp, value]) => {
      if (value) {
        const options = component.definitions[instance.definitionId].options;
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

export const transformComponentTokensToScssVariables = (component: ComponentInstance, options?: ComponentDefinitionOptions) => {
  return transform('scss', component, options);
};
