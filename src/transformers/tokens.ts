import { TokenDict } from './types.js';
import { BackgroundTokenSet, BorderTokenSet, EffectTokenSet, FillTokenSet, OpacityTokenSet, SizeTokenSet, SpacingTokenSet, TokenSet, TypographyTokenSet } from '../exporters/components/types.js';
import { transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor, transformFigmaTextAlignToCss, transformFigmaTextCaseToCssTextTransform, transformFigmaTextDecorationToCss } from '../utils/convertColor.js';
import { normalizeCssNumber } from '../utils/numbers.js';

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

const getBackgroundTokenSetTokens = (tokenSet: BackgroundTokenSet): TokenDict => ({
  'background': transformFigmaFillsToCssColor(tokenSet.background).color
});

const getSpacingTokenSetTokens = (tokenSet: SpacingTokenSet): TokenDict => ({
  'padding-y': [`${normalizeCssNumber((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2)}px`, false],
  'padding-x': [`${normalizeCssNumber((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2)}px`, false],
  'padding-top': `${normalizeCssNumber(tokenSet.padding.TOP)}px`,
  'padding-right': `${normalizeCssNumber(tokenSet.padding.RIGHT)}px`,
  'padding-bottom': `${normalizeCssNumber(tokenSet.padding.BOTTOM)}px`,
  'padding-left': [`${normalizeCssNumber(tokenSet.padding.LEFT)}px`, false],
  'padding-start': [`${normalizeCssNumber(tokenSet.padding.LEFT)}px`, false],
  'padding-end': `${normalizeCssNumber(tokenSet.padding.RIGHT)}px`,
  'spacing': [`${normalizeCssNumber(tokenSet.spacing)}px`, false],
});

const getBorderTokenSetTokens = (tokenSet: BorderTokenSet): TokenDict => ({
  'border-width': `${normalizeCssNumber(tokenSet.weight)}px`,
  'border-radius': `${normalizeCssNumber(tokenSet.radius)}px`,
  'border-color': transformFigmaFillsToCssColor(tokenSet.strokes, true).color,
  'border-style': (tokenSet.dashes[0] ?? 0) === 0 ? 'solid' : 'dashed',
});

const getTypographyTokenSetTokens = (tokenSet: TypographyTokenSet): TokenDict => ({
  'font-family': `'${tokenSet.fontFamily}'`,
  'font-size': `${normalizeCssNumber(tokenSet.fontSize)}px`,
  'font-weight': `${normalizeCssNumber(tokenSet.fontWeight)}`,
  'line-height': `${normalizeCssNumber(tokenSet.lineHeight)}`,
  'letter-spacing': `${normalizeCssNumber(tokenSet.letterSpacing)}px`,
  'text-align': transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
  'text-decoration': transformFigmaTextDecorationToCss(tokenSet.textDecoration),
  'text-transform': transformFigmaTextCaseToCssTextTransform(tokenSet.textCase)
});

const getFillTokenSetTokens = (tokenSet: FillTokenSet): TokenDict => ({
  'color': transformFigmaFillsToCssColor(tokenSet.color, true).color,
});

const getEffectTokenSetTokens = (tokenSet: EffectTokenSet): TokenDict => ({
  'box-shadow': tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none'
});

const getOpacityTokenSetTokens = (tokenSet: OpacityTokenSet): TokenDict => ({
  'opacity': `${normalizeCssNumber(tokenSet.opacity)}`,
});

const getSizeTokenSetTokens = (tokenSet: SizeTokenSet): TokenDict => ({
  'width': `${normalizeCssNumber(tokenSet.width) ?? '0'}px`,
  'width-raw': [`${normalizeCssNumber(tokenSet.width) ?? '0'}`, false],
  'height': `${normalizeCssNumber(tokenSet.height) ?? '0'}px`,
  'height-raw': [`${normalizeCssNumber(tokenSet.height) ?? '0'}`, false],
});
