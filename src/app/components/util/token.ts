import { Token } from "@handoff/transformers/types";

export const tokenReferenceFormat = (token: Token, type: 'css' | 'scss' | 'generic') => {
    let referenceObject = token.metadata.reference;
    let wrapped = '';
    if (referenceObject) {
      let reference = '';
  
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
      wrapped = type === 'css' ? `var(--${reference})` : type=== 'generic' ? reference : `$${reference}`;
  
      return reference ? wrapped : token.value;
    }
    return token.value;
  };