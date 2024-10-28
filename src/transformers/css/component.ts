import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { formatComponentCodeBlockComment } from '../utils';
import { transform } from '../transformer';
import { IntegrationObjectComponentOptions } from '../../types/config';
import { Token } from '../types';
import Handoff from 'handoff/index';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (
  componentId: string,
  component: FileComponentObject,
  integrationOptions?: IntegrationObjectComponentOptions,
  handoff?: Handoff

): string => {
  const lines = [];
  const componentCssClass = integrationOptions?.cssRootClass ?? componentId;

  lines.push(`.${componentCssClass} {`);
  const cssVars = component.instances.map(
    (instance) =>
      `\t${formatComponentCodeBlockComment(instance, '/**/')}\n${transformComponentTokensToCssVariables(instance, integrationOptions)
        .map((token) => `\t${token.name}: ${tokenReferenceFormat(token, 'css', handoff)};`)
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

export const tokenReferenceFormat = (token: Token, type: 'css' | 'scss' | 'sd', handoff: Handoff) => {
  if (!handoff || !handoff.config.useVariables) return token.value;
  let reference = token.metadata.reference;
  if (reference) {
    // There are some values that we can't yet tokenize because of the data out of figma
    if (['border-width', 'border-radius', 'border-style', 'text-align', 'text-decoration', 'text-transform'].includes(token.metadata.cssProperty)) {
      reference = undefined;
      // Some values should be suffixed with the css property
      // Everything on this list shouldn't, everything else should
    } else if (!['box-shadow', 'background', 'color', 'border-color'].includes(token.metadata.cssProperty)) {
      reference += `-${token.metadata.cssProperty}`;
    }
  }
  let wrapped = type === 'css' ? `var(--${reference})` : `$${reference}`;
  if (type === 'sd' && reference) {
    // build reference for style dictionary
    wrapped = `{${reference.replace(/-/g, '.')}}`;
  }
  return reference ? wrapped : token.value;
};
