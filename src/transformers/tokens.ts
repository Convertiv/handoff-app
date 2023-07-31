import { TokenDict } from './types';
import { BackgroundTokenSet, BorderTokenSet, EffectTokenSet, FillTokenSet, OpacityTokenSet, SizeTokenSet, SpacingTokenSet, TokenSet, TypographyTokenSet } from '../exporters/components/types';
import { transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor, transformFigmaTextAlignToCss, transformFigmaTextCaseToCssTextTransform, transformFigmaTextDecorationToCss } from '../utils/convertColor';

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

const getBorderTokenSetTokens = (tokenSet: BorderTokenSet): TokenDict => ({
  'border-width': `${tokenSet.weight}px`,
  'border-radius': `${tokenSet.radius}px`,
  'border-color': transformFigmaFillsToCssColor(tokenSet.strokes, true).color,
});

const getTypographyTokenSetTokens = (tokenSet: TypographyTokenSet): TokenDict => ({
  'font-family': `'${tokenSet.fontFamily}'`,
  'font-size': `${tokenSet.fontSize}px`,
  'font-weight': `${tokenSet.fontWeight}`,
  'line-height': `${tokenSet.lineHeight}`,
  'letter-spacing': `${tokenSet.letterSpacing}px`,
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
  'opacity': `${tokenSet.opacity}`,
});

const getSizeTokenSetTokens = (tokenSet: SizeTokenSet): TokenDict => ({
  'width': `${tokenSet.width ?? '0'}px`,
  'width-raw': [`${tokenSet.width ?? '0'}`, false],
  'height': `${tokenSet.height ?? '0'}px`,
  'height-raw': [`${tokenSet.height ?? '0'}`, false],
});