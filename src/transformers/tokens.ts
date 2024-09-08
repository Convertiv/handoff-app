import {
  BackgroundTokenDict,
  BorderTokenDict,
  EffectTokenDict,
  FillTokenDict,
  KeyToTokenSetMap,
  OpacityTokenDict,
  SpacingTokenDict,
  TokenDict,
  TypographyTokenDict,
} from './types';
import {
  BackgroundTokenSet,
  BorderTokenSet,
  EffectTokenSet,
  FillTokenSet,
  OpacityTokenSet,
  SizeTokenSet,
  SpacingTokenSet,
  TokenSet,
  TypographyTokenSet,
} from '../exporters/components/types';
import {
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../utils/convertColor';
import { normalizeCssNumber } from '../utils/numbers';
import { Exportable } from '../types';

export const getTokenSetTokens = (tokenSet: TokenSet): TokenDict | undefined => {
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

export const getTokenSetNameByProperty = (cssProp: string): Exportable | undefined => {
  return keyToTokenSetMap[cssProp as keyof KeyToTokenSetMap];
};

const getBackgroundTokenSetTokens = (tokenSet: BackgroundTokenSet): BackgroundTokenDict => ({
  background: transformFigmaFillsToCssColor(tokenSet.background).color,
});

const getSpacingTokenSetTokens = (tokenSet: SpacingTokenSet): SpacingTokenDict => ({
  'padding-y': [`${normalizeCssNumber((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2)}px`, false],
  'padding-x': [`${normalizeCssNumber((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2)}px`, false],
  'padding-top': `${normalizeCssNumber(tokenSet.padding.TOP)}px`,
  'padding-right': `${normalizeCssNumber(tokenSet.padding.RIGHT)}px`,
  'padding-bottom': `${normalizeCssNumber(tokenSet.padding.BOTTOM)}px`,
  'padding-left': [`${normalizeCssNumber(tokenSet.padding.LEFT)}px`, false],
  'padding-start': [`${normalizeCssNumber(tokenSet.padding.LEFT)}px`, false],
  'padding-end': `${normalizeCssNumber(tokenSet.padding.RIGHT)}px`,
  spacing: [`${normalizeCssNumber(tokenSet.spacing)}px`, false],
});

const getBorderTokenSetTokens = (tokenSet: BorderTokenSet): BorderTokenDict => ({
  'border-width': `${normalizeCssNumber(tokenSet.weight)}px`,
  'border-radius': `${normalizeCssNumber(tokenSet.radius)}px`,
  'border-color': transformFigmaFillsToCssColor(tokenSet.strokes, true).color,
  'border-style': (tokenSet.dashes[0] ?? 0) === 0 ? 'solid' : 'dashed',
});

const getTypographyTokenSetTokens = (tokenSet: TypographyTokenSet): TypographyTokenDict => ({
  'font-family': `'${tokenSet.fontFamily}'`,
  'font-size': `${normalizeCssNumber(tokenSet.fontSize)}px`,
  'font-weight': `${normalizeCssNumber(tokenSet.fontWeight)}`,
  'line-height': `${normalizeCssNumber(tokenSet.lineHeight)}`,
  'letter-spacing': `${normalizeCssNumber(tokenSet.letterSpacing)}px`,
  'text-align': transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
  'text-decoration': transformFigmaTextDecorationToCss(tokenSet.textDecoration),
  'text-transform': transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
});

const getFillTokenSetTokens = (tokenSet: FillTokenSet): FillTokenDict => ({
  color: transformFigmaFillsToCssColor(tokenSet.color, true).color,
});

const getEffectTokenSetTokens = (tokenSet: EffectTokenSet): EffectTokenDict => ({
  'box-shadow': tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
});

const getOpacityTokenSetTokens = (tokenSet: OpacityTokenSet): OpacityTokenDict => ({
  opacity: `${normalizeCssNumber(tokenSet.opacity)}`,
});

const getSizeTokenSetTokens = (tokenSet: SizeTokenSet): TokenDict => ({
  width: `${normalizeCssNumber(tokenSet.width) ?? '0'}px`,
  'width-raw': [`${normalizeCssNumber(tokenSet.width) ?? '0'}`, false],
  height: `${normalizeCssNumber(tokenSet.height) ?? '0'}px`,
  'height-raw': [`${normalizeCssNumber(tokenSet.height) ?? '0'}`, false],
});

const keyToTokenSetMap: KeyToTokenSetMap = {
  // Background tokens
  background: 'BACKGROUND',

  // Spacing tokens
  'padding-y': 'SPACING',
  'padding-x': 'SPACING',
  'padding-top': 'SPACING',
  'padding-right': 'SPACING',
  'padding-bottom': 'SPACING',
  'padding-left': 'SPACING',
  'padding-start': 'SPACING',
  'padding-end': 'SPACING',
  spacing: 'SPACING',

  // Border tokens
  'border-width': 'BORDER',
  'border-radius': 'BORDER',
  'border-color': 'BORDER',
  'border-style': 'BORDER',

  // Typography tokens
  'font-family': 'TYPOGRAPHY',
  'font-size': 'TYPOGRAPHY',
  'font-weight': 'TYPOGRAPHY',
  'line-height': 'TYPOGRAPHY',
  'letter-spacing': 'TYPOGRAPHY',
  'text-align': 'TYPOGRAPHY',
  'text-decoration': 'TYPOGRAPHY',
  'text-transform': 'TYPOGRAPHY',

  // Fill tokens
  color: 'FILL',

  // Effect tokens
  'box-shadow': 'EFFECT',

  // Opacity tokens
  opacity: 'OPACITY',

  // Size tokens
  width: 'SIZE',
  'width-raw': 'SIZE',
  height: 'SIZE',
  'height-raw': 'SIZE',
};
