import { Functions as CoreFunctions, Types as CoreTypes } from 'handoff-core';

export const getComponentInstanceScssTokens = (
  component: CoreTypes.IComponentInstance,
  options?: CoreTypes.IHandoffConfigurationComponentOptions
) => {
  return CoreFunctions.getComponentInstanceTokens('scss', component, options);
};

export const tokenReferenceFormat = (token: CoreTypes.IToken, type: 'css' | 'scss' | 'sd') => {
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

const toSDMachineName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/gi, '-')
    .replace(/\s\-\s|\s+/gi, '-')
    .replace(/-+/gi, '-')
    .replace(/(^,)|(,$)/g, '');
};
