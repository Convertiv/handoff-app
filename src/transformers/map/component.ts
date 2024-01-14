import { transform } from '../transformer';
import { FileComponentObject } from '../../exporters/components/types';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToMap = (_: string, component: FileComponentObject) => {
  const map = {} as Record<string, string>;

  component.instances.forEach((instance) => {
    const options = component.definitions[instance.definitionId].options;
    const tokens = transform('map', instance, options);

    tokens.forEach((token) => {
      map[token.name] = token.value;
    });
  });

  return map;
};
