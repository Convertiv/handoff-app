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
export const transform = (tokenType: TokenType, component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions) => {
  let tokens: Token[] = [];

  for (const part in component.parts) {
    const tokenSets = component.parts[part];

    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }

    tokenSets.forEach(tokenSet => 
      tokens.push(...transformTokens(getTokenSetTokens(tokenSet), tokenType, component, part, options))
    )
  }
  
  return tokens;
};

const transformTokens = (tokens: TokenDict | undefined, tokenType: TokenType, component: Component, part: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => {
  return tokens ? Object.entries(tokens).map(([cssProperty, value]) => ({
    name: formatTokenName(tokenType, component, part, cssProperty, options),
    value: value instanceof Array ? value[0] : value,
    metadata: {
      part,
      cssProperty,
      isSupportedCssProperty: value instanceof Array ? value[1] : true ,
      nameSegments: getTokenNameSegments(component, part, cssProperty, options),
    }
  })) : [];
};