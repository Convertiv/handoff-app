import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { formatComponentCodeBlockComment } from '../utils';
import { transform } from '../transformer';
import { IntegrationObjectComponentOptions } from '../../types/config';
import { Token } from '../types';
import Handoff from 'handoff/index';
import { toMachineName, toSDMachineName } from '../../exporters/design';

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

export const tokenReferenceFormat = (token: Token, type: 'css' | 'scss' | 'sd', handoff?: Handoff) => {
  if (!handoff || !handoff.config.useVariables) return token.value;
  let referenceObject = token.metadata.reference;
  let wrapped = '';
  if (referenceObject) {
    let reference = '';
    if (type === 'sd') {
      // build reference for style dictionary
      if (referenceObject.type === 'color') {
        reference = `color.${referenceObject.group}.${toSDMachineName(referenceObject.name)}`;
      } else if (referenceObject.type === 'effect') {
        reference = `effect.${referenceObject.group}.${toSDMachineName(referenceObject.name)}`;
      } else if (referenceObject.type === 'typography') {
        switch (token.metadata.cssProperty) {
          case 'font-size':
            reference = `typography.${toSDMachineName(referenceObject.name)}.font.size`;
            break;
          case 'font-weight':
            reference = `typography.${toSDMachineName(referenceObject.name)}.font.weight`;
            break;
          case 'font-family':
            reference = `typography.${toSDMachineName(referenceObject.name)}.font.family`;
            break;
          case 'line-height':
            reference = `typography.${toSDMachineName(referenceObject.name)}.line.height`;
            break;
          case 'letter-spacing':
            reference = `typography.${toSDMachineName(referenceObject.name)}.letter.spacing`;
            break;
        }
      }
      return reference ? `{${reference}}` : token.value;
    } else {
      reference = referenceObject.reference;
      // There are some values that we can't yet tokenize because of the data out of figma
      if (
        ['border-width', 'border-radius', 'border-style', 'text-align', 'text-decoration', 'text-transform'].includes(
          token.metadata.cssProperty
        )
      ) {
        reference = undefined;
        // Some values should be suffixed with the css property
        // Everything on this list shouldn't, everything else should
      } else if (!['box-shadow', 'background', 'color', 'border-color'].includes(token.metadata.cssProperty)) {
        reference += `-${token.metadata.cssProperty}`;
      }
      wrapped = type === 'css' ? `var(--${reference})` : `$${reference}`;
    }

    return reference ? wrapped : token.value;
  }
  return token.value;
};
