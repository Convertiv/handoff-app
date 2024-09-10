import { ComponentInstance } from '../exporters/components/types';
import { Token, TokenDict, TokenType } from './types';
import { formatTokenName, getTokenNameSegments } from './utils';
import { getTokenSetTokens } from './tokens';
import { IntegrationObjectComponentOptions } from '../types/config';

/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
export const transform = (tokenType: TokenType, component: ComponentInstance, options?: IntegrationObjectComponentOptions) => {
  let tokens: Token[] = [];

  for (const part in component.parts) {
    const tokenSets = component.parts[part];

    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }

    tokenSets.forEach((tokenSet) => tokens.push(...transformTokens(getTokenSetTokens(tokenSet), tokenType, component, part, options)));
  }

  return tokens;
};

const transformTokens = (
  tokens: TokenDict | undefined,
  tokenType: TokenType,
  component: ComponentInstance,
  part: string,
  options?: IntegrationObjectComponentOptions
) => {
  return tokens
    ? Object.entries(tokens).map(([cssProperty, value]) => ({
        name: formatTokenName(tokenType, component.name, component.variantProperties, part, cssProperty, options),
        value: value instanceof Array ? value[0] : value,
        metadata: {
          part,
          cssProperty,
          isSupportedCssProperty: value instanceof Array ? value[1] : true,
          nameSegments: getTokenNameSegments(component.name, component.variantProperties, part, cssProperty, options),
        },
      }))
    : [];
};