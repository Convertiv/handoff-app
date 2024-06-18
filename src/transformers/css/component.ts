import { ComponentInstance, FileComponentObject } from '../../exporters/components/types.js';
import { formatComponentCodeBlockComment } from '../utils.js';
import { ComponentDefinitionOptions } from '../../types.js';
import { transform } from '../transformer.js';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (componentId: string, component: FileComponentObject): string => {
  const lines = [];

  const options = Object.values(component.definitions)[0]?.options;
  const componentCssClass = options?.transformer.cssRootClass ?? componentId;

  lines.push(`.${componentCssClass} {`);
  const cssVars = component.instances.map(
    (instance) =>
      `\t${formatComponentCodeBlockComment(instance, '/**/')}\n${transformComponentTokensToCssVariables(
        instance,
        component.definitions[instance.definitionId].options
      )
        .map((token) => `\t${token.name}: ${token.value};`)
        .join('\n')}`
  );
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export const transformComponentTokensToCssVariables = (component: ComponentInstance, options?: ComponentDefinitionOptions) => {
  return transform('css', component, options);
};
