import { Component } from "../exporters/components/extractor";
import { TokenSet } from "../exporters/components/types";
import { ExportableSharedOptions, ExportableTransformerOptions } from "../types";
import { transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor, transformFigmaTextAlignToCss, transformFigmaTextCaseToCssTextTransform, transformFigmaTextDecorationToCss } from "../utils/convertColor";
import { ValueProperty } from "./types";
import { formatVariableName } from "./utils";

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
}

const transformBackgroundTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'BACKGROUND'
    ? {
      [formatVariableName(variableType, component, part, 'background', options)]: {
        value: transformFigmaFillsToCssColor(tokenSet.background).color,
        property: 'background',
        group: part
      },
    } : {}
}

const transformSpacingTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'SPACING'
    ? {
      // Padding
      [formatVariableName(variableType, component, part, 'padding-y', options)]: {
        value: `${tokenSet.padding.TOP}px`,
        property: 'padding-y',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-x', options)]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-x',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-top', options)]: {
        value: `${tokenSet.padding.TOP}px`,
        property: 'padding-top',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-right', options)]: {
        value: `${tokenSet.padding.RIGHT}px`,
        property: 'padding-right',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-bottom', options)]: {
        value: `${tokenSet.padding.BOTTOM}px`,
        property: 'padding-bottom',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-left', options)]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-left',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-start', options)]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-start',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'padding-end', options)]: {
        value: `${tokenSet.padding.RIGHT}px`,
        property: 'padding-end',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'spacing', options)]: {
        value: `${tokenSet.spacing}px`,
        property: 'spacing',
        group: part,
      },
    } : {}
}

const transformBorderTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'BORDER'
    ? {
      [formatVariableName(variableType, component, part, 'border-width', options)]: {
        value: `${tokenSet.weight}px`,
        property: 'border-width',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'border-radius', options)]: {
        value: `${tokenSet.radius}px`,
        property: 'border-radius',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'border-color', options)]: {
        value: transformFigmaFillsToCssColor(tokenSet.strokes).color,
        property: 'border-color',
        group: part,
      },
    } : {}
}

const transformTypographyTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'TYPOGRAPHY'
    ? {
      [formatVariableName(variableType, component, part, 'font-family', options)]: {
        value: `'${tokenSet.fontFamily}'`,
        property: 'font-family',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'font-size', options)]: {
        value: `${tokenSet.fontSize}px`,
        property: 'font-size',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'font-weight', options)]: {
        value: `${tokenSet.fontWeight}`,
        property: 'font-weight',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'line-height', options)]: {
        value: `${tokenSet.lineHeight}`,
        property: 'line-height',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'letter-spacing', options)]: {
        value: `${tokenSet.letterSpacing}px`,
        property: 'letter-spacing',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'text-align', options)]: {
        value: transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
        property: 'text-align',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'text-decoration', options)]: {
        value: transformFigmaTextDecorationToCss(tokenSet.textDecoration),
        property: 'text-decoration',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'text-transform', options)]: {
        value: transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
        property: 'text-transform',
        group: part,
      },
    } : {}
}

const transformFillTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'FILL'
    ? {
      [formatVariableName(variableType, component, part, 'color', options)]: {
        value: transformFigmaFillsToCssColor(tokenSet.color).color,
        property: 'color',
        group: part,
      },
    } : {}
}

const transformEffectTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'EFFECT'
    ? {
      [formatVariableName(variableType, component, part, 'box-shadow', options)]: {
        value: tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
        property: 'color',
        group: part,
      },
    } : {}
}

const transformOpacityTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'OPACITY'
    ? {
      [formatVariableName(variableType, component, part, 'opacity', options)]: {
        value: `${tokenSet.opacity}`,
        property: 'opacity',
        group: part,
      },
    } : {}
}

const transformSizeTokenSet = (variableType: 'css'|'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions): Record<string, ValueProperty> => {
  return tokenSet.name === 'SIZE'
    ? {
      [formatVariableName(variableType, component, part, 'width', options)]: {
        value: `${tokenSet.width ?? '0'}px`,
        property: 'width',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'width-raw', options)]: {
        value: `${tokenSet.width ?? '0'}`,
        property: 'width-raw',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'height', options)]: {
        value: `${tokenSet.height ?? '0'}px`,
        property: 'height',
        group: part,
      },
      [formatVariableName(variableType, component, part, 'height-raw', options)]: {
        value: `${tokenSet.height ?? '0'}`,
        property: 'height-raw',
        group: part,
      },
    } : {}
}
