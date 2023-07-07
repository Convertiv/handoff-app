import { Component } from '../exporters/components/extractor';
import { BackgroundTokenSet, BorderTokenSet, EffectTokenSet, FillTokenSet, OpacityTokenSet, SizeTokenSet, SpacingTokenSet, TokenSet, TypographyTokenSet } from '../exporters/components/types';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import {
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../utils/convertColor';
import { ValueProperty, TokenType } from './types';
import { formatTokenName, getReducedTokenPropertyPath } from './utils';

/**
 * Performs the transformation of the component tokens.
 * 
 * @param component 
 * @param options 
 * @returns 
 */
export const transform = (tokenType: TokenType, component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
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

const getTokenSetTokens = (tokenSet: TokenSet): PropValDict | undefined => {
  switch (tokenSet.name) {
    case 'BACKGROUND':
      return getBackgroundTokenSetTokens(tokenSet);
    case 'SPACING':
      return getSpacingTokenSetTokens(tokenSet);
    case 'BORDER':
      return getBorderTokenSetTokens(tokenSet);
    case 'TYPOGRAPHY':
      return getTypographyTokenSetTokens(tokenSet);
    case 'FILL':
      return getFillTokenSetTokens(tokenSet);
    case 'EFFECT':
      return getEffectTokenSetTokens(tokenSet);
    case 'OPACITY':
      return getOpacityTokenSetTokens(tokenSet);
    case 'SIZE':
      return getSizeTokenSetTokens(tokenSet);
    default:
      return undefined;
  }
};

const getBackgroundTokenSetTokens = (tokenSet: BackgroundTokenSet): PropValDict => ({
  'background': transformFigmaFillsToCssColor(tokenSet.background).color
});

const getSpacingTokenSetTokens = (tokenSet: SpacingTokenSet): PropValDict => ({
  'padding-y': [`${(tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2}px`, false],
  'padding-x': [`${(tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2}px`, false],
  'padding-top': `${tokenSet.padding.TOP}px`,
  'padding-right': `${tokenSet.padding.RIGHT}px`,
  'padding-bottom': `${tokenSet.padding.BOTTOM}px`,
  'padding-left': [`${tokenSet.padding.LEFT}px`, false],
  'padding-start': [`${tokenSet.padding.LEFT}px`, false],
  'padding-end': `${tokenSet.padding.RIGHT}px`,
  'spacing': [`${tokenSet.spacing}px`, false],
});

const getBorderTokenSetTokens = (tokenSet: BorderTokenSet): PropValDict => ({
  'border-width': `${tokenSet.weight}px`,
  'border-radius': `${tokenSet.radius}px`,
  'border-color': transformFigmaFillsToCssColor(tokenSet.strokes).color,
});

const getTypographyTokenSetTokens = (tokenSet: TypographyTokenSet): PropValDict => ({
  'font-family': `'${tokenSet.fontFamily}'`,
  'font-size': `${tokenSet.fontSize}px`,
  'font-weight': `${tokenSet.fontWeight}`,
  'line-height': `${tokenSet.lineHeight}`,
  'letter-spacing': `${tokenSet.letterSpacing}px`,
  'text-align': transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
  'text-decoration': transformFigmaTextDecorationToCss(tokenSet.textDecoration),
  'text-transform': transformFigmaTextCaseToCssTextTransform(tokenSet.textCase)
});

const getFillTokenSetTokens = (tokenSet: FillTokenSet): PropValDict => ({
  'color': transformFigmaFillsToCssColor(tokenSet.color).color,
});

const getEffectTokenSetTokens = (tokenSet: EffectTokenSet): PropValDict => ({
  'box-shadow': tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none'
});

const getOpacityTokenSetTokens = (tokenSet: OpacityTokenSet): PropValDict => ({
  'opacity': `${tokenSet.opacity}`,
});

const getSizeTokenSetTokens = (tokenSet: SizeTokenSet): PropValDict => ({
  'width': `${tokenSet.width ?? '0'}px`,
  'width-raw': [`${tokenSet.width ?? '0'}`, false],
  'height': `${tokenSet.height ?? '0'}px`,
  'height-raw': [`${tokenSet.height ?? '0'}`, false],
});

const transformTokens = (tokens: PropValDict | undefined, tokenType: TokenType, component: Component, part: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => {
  return tokens ? Object.entries(tokens).reduce((record, [property, value]) => ({
    ...record, [formatTokenName(tokenType, component, part, property, options)]: {
      value: value instanceof Array ? value[0] : value,
      property,
      part,
      metadata: {
        propertyPath: getReducedTokenPropertyPath(component, part, property, options),
        isSupportedCssProperty: value instanceof Array ? value[1] : true 
      }
    }
  }), {} as Record<string, ValueProperty>) : {}
};

type PropValDict = { [property: string]: string | [value: string, isSupportedCssProperty: boolean] }