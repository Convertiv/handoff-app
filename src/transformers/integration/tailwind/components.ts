import { Component } from '../../../exporters/components/extractor';
import { transformComponentTokens } from '../../utils';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../../types';

/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export const transformComponentsToTailwind = (
  _: string,
  components: Component[],
  options?: ExportableTransformerOptions & ExportableSharedOptions
): string => {
  const sd = {} as any;
  const tokenNamePartSeparator = '//'; // TODO: Temp

  components.forEach((component) => {
    Object.entries(transformComponentTokens(component, options)).forEach(([tokenName, tokenValue]) => {
      console.log(tokenName);
      const path = tokenName.split(tokenNamePartSeparator); // TODO: Improve/remove by returning the property name structure?
      const lastIdx = path.length - 1;
      const componentName = path[0];
      const componentType = path[1];
      const componentState = path[2];
      const className = `.${componentName}-${componentType}`;
      let ref = sd;
      if (!ref[className]) ref[className] = {};

      const propParts = path[lastIdx].split('-');
      const key = `${propParts[0]}${propParts
        .slice(1)
        .map((el) => el.charAt(0).toUpperCase() + el.slice(1))
        .join('')}`;
      if (componentState === 'default') {
        ref[className][key] = tokenValue.value;
      } else {
        if (!ref[className][`$${componentState}`]) ref[className][`$${componentState}`] = {};
        ref[className][`$${componentState}`][key] = tokenValue.value;
      }
    });
  });

  return `module.exports = ${JSON.stringify(sd, null, 2)};`;
};
