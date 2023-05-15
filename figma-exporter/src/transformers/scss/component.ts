import { ValueProperty } from './types';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents, getTypesFromComponents, transformFigmaTextAlignToCss, transformFigmaTextCaseToCssTextTransform, transformFigmaTextDecorationToCss } from '../css/utils';
import { mapComponentSize } from '../../utils/config';
import { getScssVariableName, transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor } from '../../utils/convertColor';
import { Component } from '../../exporters/components/extractor';
import { TokenSet } from '../../exporters/components/types';

export const transformComponentsToScssTypes = (name: string, components: Component[]): string => {
  const lines = [];

  const themes = getThemesFromComponents(components);
  const types = getTypesFromComponents(components);
  const states = getStatesFromComponents(components);
  const sizes = getSizesFromComponents(components);

  // Types
  if (types && types.length > 0) {
    lines.push(
      `$${name}-variants: ( ${types.map((type) => `"${type}"`).join(', ')});`
    );
  }
  
  // Sizes
  if (sizes && sizes.length > 0) {
    lines.push(
      `$${name}-sizes: ( ${sizes.map((type) => `"${mapComponentSize(type, name)}"`).join(', ')} );`
    );
  }

  // Themes
  if (themes && themes.length > 0) {
    lines.push(
      `$${name}-themes: ( ${themes.map((type) => `"${type}"`).join(', ')} );`
    );
  }
  
  // States
  if (states && states.length > 0) {
    lines.push(
      `$${name}-states: ( ${states.map((type) => `"${type == 'default' ? '' : type}"`).join(', ')} );`
    );
  }

  return lines.join('\n\n') + '\n';
}

export const transformComponentTokensToScssVariables = (tokens: Component): Record<string, ValueProperty> => {
  let result = {};
  
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;

  const state = tokens.componentType === 'design'
    ? tokens.activity ?? tokens.state
    : undefined;

  const type = tokens.componentType === 'design'
    ? (state && state === tokens.activity ? tokens.state : tokens.type)
    : tokens.layout ?? mapComponentSize(tokens.size ?? '', tokens.name);

  for (const partId in tokens.parts) {
    const tokenSets = tokens.parts[partId];

    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }

    for (const tokenSet of tokenSets) {
      const transformer = getTokenSetTransformer(tokenSet);

      if (!transformer) {
        continue;
      }

      result = {...result, ...transformer(tokens.name, partId === '$' ? '': partId.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), tokenSet, { theme, type, state })}
    }
  }
  
  return result;
}

const getTokenSetTransformer = (tokenSet: TokenSet) => {
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
    default:
      return undefined;
  }
}

const transformBackgroundTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'BACKGROUND'
    ? {
      [getScssVariableName({ component, part, property: 'background', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaFillsToCssColor(tokenSet.background).color,
        property: 'background',
        group: part
      },
    } : {}
}

const transformSpacingTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'SPACING'
    ? {
      // Padding
      [getScssVariableName({ component, part, property: 'padding-y', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.TOP}px`,
        property: 'padding-y',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'padding-x', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-x',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'padding-top', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.TOP}px`,
        property: 'padding-top',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'padding-right', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.RIGHT}px`,
        property: 'padding-right',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'padding-bottom', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.BOTTOM}px`,
        property: 'padding-bottom',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'padding-left', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-left',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'spacing', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.spacing}px`,
        property: 'spacing',
        group: part,
      },
    } : {}
}

const transformBorderTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'BORDER'
    ? {
      [getScssVariableName({ component, part, property: 'border-width', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.weight}px`,
        property: 'border-width',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'border-radius', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.radius}px`,
        property: 'border-radius',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'border-color', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaFillsToCssColor(tokenSet.strokes).color,
        property: 'border-color',
        group: part,
      },
    } : {}
}

const transformTypographyTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'TYPOGRAPHY'
    ? {
      [getScssVariableName({ component, part, property: 'font-family', theme: params.theme, type: params.type, state: params.state })]: {
        value: `'${tokenSet.fontFamily}'`,
        property: 'font-family',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'font-size', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.fontSize}px`,
        property: 'font-size',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'font-weight', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.fontWeight}`,
        property: 'font-weight',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'line-height', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.lineHeight}`,
        property: 'line-height',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'letter-spacing', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.letterSpacing}px`,
        property: 'letter-spacing',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'text-align', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
        property: 'text-align',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'text-decoration', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaTextDecorationToCss(tokenSet.textDecoration),
        property: 'text-decoration',
        group: part,
      },
      [getScssVariableName({ component, part, property: 'text-transform', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
        property: 'text-transform',
        group: part,
      },
    } : {}
}

const transformFillTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'FILL'
    ? {
      [getScssVariableName({ component, part, property: 'color', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaFillsToCssColor(tokenSet.color).color,
        property: 'color',
        group: part,
      },
    } : {}
}

const transformEffectTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'EFFECT'
    ? {
      [getScssVariableName({ component, part, property: 'box-shadow', theme: params.theme, type: params.type, state: params.state })]: {
        value: tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
        property: 'color'
      },
    } : {}
}

interface TransformerParams { theme: string | undefined, type: string | undefined, state: string | undefined };