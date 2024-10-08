import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { formatComponentCodeBlockComment } from '../utils';
import { transform } from '../transformer';
import { IntegrationObjectComponentOptions } from '../../types/config';
import { Token } from '../types';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (
  componentId: string,
  component: FileComponentObject,
  integrationOptions?: IntegrationObjectComponentOptions
): string => {
  const lines = [];
  const componentCssClass = integrationOptions?.cssRootClass ?? componentId;

  lines.push(`.${componentCssClass} {`);
  const cssVars = component.instances.map(
    (instance) =>
      `\t${formatComponentCodeBlockComment(instance, '/**/')}\n${transformComponentTokensToCssVariables(instance, integrationOptions)
        .map((token) => `\t${token.name}: ${tokenReferenceFormat(token, 'css')};`)
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

export const tokenReferenceFormat = (token: Token, type: 'css' | 'scss') => {
  let reference = token.metadata.reference;
  if (reference) {
    // If the token is a border token, we don't need to add the css property to the reference
    if (['border-width', 'border-radius', 'border-style'].includes(token.metadata.cssProperty)) {
      reference = undefined;
    } else if (!['box-shadow', 'background','color'].includes(token.metadata.cssProperty) ) {
      reference += `-${token.metadata.cssProperty}`;
    }
  }
  const wrapped = type === 'css' ? `var(--${reference})` : `$${reference}`;
  return reference ? wrapped : token.value;
};
