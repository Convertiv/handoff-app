import { Component } from '../exporters/components/extractor';
import { TokenSet } from '../exporters/components/types';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import {
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../utils/convertColor';
import { ValueProperty, TokenType } from './types';
import { formatTokenName } from './utils';

export const getTokenSetTransformer = (tokenSet: TokenSet) => {
  switch (tokenSet.name) {
    case 'BACKGROUND':
      return transformBackgroundTokenSet;
    case 'SPACING':
      return transformSpacingTokenSet;
    case 'BORDER':
      return transformBorderTokenSet;
    case 'TYPOGRAPHY':
      return transformTypographyTokenSet;
    case 'FILL':
      return transformFillTokenSet;
    case 'EFFECT':
      return transformEffectTokenSet;
    case 'OPACITY':
      return transformOpacityTokenSet;
    case 'SIZE':
      return transformSizeTokenSet;
    default:
      return undefined;
  }
};

const transformBackgroundTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'BACKGROUND'
    ? {
        [formatTokenName(tokenType, component, part, 'background', options)]: {
          value: transformFigmaFillsToCssColor(tokenSet.background).color,
          property: 'background',
          part,
        },
      }
    : {};
};

const transformSpacingTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'SPACING'
    ? {
        // Padding
        [formatTokenName(tokenType, component, part, 'padding-y', options)]: {
          value: `${(tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2}px`,
          property: 'padding-y',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-x', options)]: {
          value: `${(tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2}px`,
          property: 'padding-x',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-top', options)]: {
          value: `${tokenSet.padding.TOP}px`,
          property: 'padding-top',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-right', options)]: {
          value: `${tokenSet.padding.RIGHT}px`,
          property: 'padding-right',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-bottom', options)]: {
          value: `${tokenSet.padding.BOTTOM}px`,
          property: 'padding-bottom',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-left', options)]: {
          value: `${tokenSet.padding.LEFT}px`,
          property: 'padding-left',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-start', options)]: {
          value: `${tokenSet.padding.LEFT}px`,
          property: 'padding-start',
          part,
        },
        [formatTokenName(tokenType, component, part, 'padding-end', options)]: {
          value: `${tokenSet.padding.RIGHT}px`,
          property: 'padding-end',
          part,
        },
        [formatTokenName(tokenType, component, part, 'spacing', options)]: {
          value: `${tokenSet.spacing}px`,
          property: 'spacing',
          part,
        },
      }
    : {};
};

const transformBorderTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'BORDER'
    ? {
        [formatTokenName(tokenType, component, part, 'border-width', options)]: {
          value: `${tokenSet.weight}px`,
          property: 'border-width',
          part,
        },
        [formatTokenName(tokenType, component, part, 'border-radius', options)]: {
          value: `${tokenSet.radius}px`,
          property: 'border-radius',
          part,
        },
        [formatTokenName(tokenType, component, part, 'border-color', options)]: {
          value: transformFigmaFillsToCssColor(tokenSet.strokes).color,
          property: 'border-color',
          part,
        },
      }
    : {};
};

const transformTypographyTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'TYPOGRAPHY'
    ? {
        [formatTokenName(tokenType, component, part, 'font-family', options)]: {
          value: `'${tokenSet.fontFamily}'`,
          property: 'font-family',
          part,
        },
        [formatTokenName(tokenType, component, part, 'font-size', options)]: {
          value: `${tokenSet.fontSize}px`,
          property: 'font-size',
          part,
        },
        [formatTokenName(tokenType, component, part, 'font-weight', options)]: {
          value: `${tokenSet.fontWeight}`,
          property: 'font-weight',
          part,
        },
        [formatTokenName(tokenType, component, part, 'line-height', options)]: {
          value: `${tokenSet.lineHeight}`,
          property: 'line-height',
          part,
        },
        [formatTokenName(tokenType, component, part, 'letter-spacing', options)]: {
          value: `${tokenSet.letterSpacing}px`,
          property: 'letter-spacing',
          part,
        },
        [formatTokenName(tokenType, component, part, 'text-align', options)]: {
          value: transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
          property: 'text-align',
          part,
        },
        [formatTokenName(tokenType, component, part, 'text-decoration', options)]: {
          value: transformFigmaTextDecorationToCss(tokenSet.textDecoration),
          property: 'text-decoration',
          part,
        },
        [formatTokenName(tokenType, component, part, 'text-transform', options)]: {
          value: transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
          property: 'text-transform',
          part,
        },
      }
    : {};
};

const transformFillTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'FILL'
    ? {
        [formatTokenName(tokenType, component, part, 'color', options)]: {
          value: transformFigmaFillsToCssColor(tokenSet.color).color,
          property: 'color',
          part,
        },
      }
    : {};
};

const transformEffectTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'EFFECT'
    ? {
        [formatTokenName(tokenType, component, part, 'box-shadow', options)]: {
          value: tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
          property: 'color',
          part,
        },
      }
    : {};
};

const transformOpacityTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'OPACITY'
    ? {
        [formatTokenName(tokenType, component, part, 'opacity', options)]: {
          value: `${tokenSet.opacity}`,
          property: 'opacity',
          part,
        },
      }
    : {};
};

const transformSizeTokenSet = (
  tokenType: TokenType,
  component: Component,
  part: string,
  tokenSet: TokenSet,
  options?: ExportableTransformerOptions & ExportableSharedOptions
): Record<string, ValueProperty> => {
  return tokenSet.name === 'SIZE'
    ? {
        [formatTokenName(tokenType, component, part, 'width', options)]: {
          value: `${tokenSet.width ?? '0'}px`,
          property: 'width',
          part,
        },
        [formatTokenName(tokenType, component, part, 'width-raw', options)]: {
          value: `${tokenSet.width ?? '0'}`,
          property: 'width-raw',
          part,
        },
        [formatTokenName(tokenType, component, part, 'height', options)]: {
          value: `${tokenSet.height ?? '0'}px`,
          property: 'height',
          part,
        },
        [formatTokenName(tokenType, component, part, 'height-raw', options)]: {
          value: `${tokenSet.height ?? '0'}`,
          property: 'height-raw',
          part,
        },
      }
    : {};
};
