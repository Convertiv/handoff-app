import { Component } from '../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import { Token, TokenDict, TokenType } from './types';
import { formatTokenName, getTokenNameSegments } from './utils';
import { getTokenSetTokens } from './tokens';

/**
 * Performs the transformation of the component tokens.
 * @param component 
 * @param options 
 * @returns 
 */
export const transform = (tokenType: TokenType, component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, Token> => {
  let result = {};

  for (const part in component.parts) {
    const tokenSets = component.parts[part];

    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }

    for (const tokenSet of tokenSets) {
      const tokens = getTokenSetTokens(tokenSet);
      result = {...result, ...transformTokens(tokens, tokenType, component, part, options)}
    }
  }
  
  return result;
};

const transformTokens = (tokens: TokenDict | undefined, tokenType: TokenType, component: Component, part: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => {
  return tokens ? Object.entries(tokens).reduce((record, [property, value]) => ({
    ...record, [formatTokenName(tokenType, component, part, property, options)]: {
      value: value instanceof Array ? value[0] : value,
      property,
      part,
      metadata: {
        propertyPath: getTokenNameSegments(component, part, property, options),
        isSupportedCssProperty: value instanceof Array ? value[1] : true 
      }
    }
  }), {} as Record<string, Token>) : {}
};