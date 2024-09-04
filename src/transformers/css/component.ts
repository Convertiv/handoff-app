import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { formatComponentCodeBlockComment } from '../utils';
import { transform } from '../transformer';
import { IntegrationObjectComponentOptions } from '../../types/config';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (
  componentId: string,
  component: FileComponentObject,
  integrationOptions?: IntegrationObjectComponentOptions,
): string => {
  const lines = [];
  const componentCssClass = integrationOptions?.cssRootClass ?? componentId;

  lines.push(`.${componentCssClass} {`);
  const cssVars = component.instances.map(
    (instance) =>
      `\t${formatComponentCodeBlockComment(instance, '/**/')}\n${transformComponentTokensToCssVariables(instance, integrationOptions)
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
export const transformComponentTokensToCssVariables = (component: ComponentInstance, options?: IntegrationObjectComponentOptions) => {
  return transform('css', component, options);
};
