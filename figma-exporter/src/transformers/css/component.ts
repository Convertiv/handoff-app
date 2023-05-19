import { ValueProperty } from './types';
import {
  getCssVariableName,
  transformFigmaEffectToCssBoxShadow,
  // transformFigmaEffectToCssBoxShadow,
  // transformFigmaNumberToCss,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../utils/convertColor';
import { Component } from '../../exporters/components/extractor';
import { TokenSet } from '../../exporters/components/types';
import { componentCodeBlockComment } from '../utils';
import { mapComponentSize } from '../../utils/config';

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export const transformComponentsToCssVariables = (components: Component[]): string => {
  const lines = [];

  const componentName = components[0].name;
  const componentCssClass = components[0].rootCssClass ?? componentName;
  
  lines.push(`.${componentCssClass} {`)
  const cssVars = components.map((tokens) => `\t${componentCodeBlockComment(componentName, tokens, '/**/')}\n${Object.entries(transformComponentTokensToCssVariables(componentName, tokens))
    .map(([variable, value]) => `\t${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export const transformComponentTokensToCssVariables = (componentName: string, tokens: Component): Record<string, ValueProperty> => {
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

      result = {...result, ...transformer(componentName, partId === '$' ? '': partId.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), tokenSet, { theme, type, state })}
    }
  }
  
  return result;
};

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
    case 'OPACITY':
      return transformOpacityTokenSet;
    case 'SIZE':
      return transformSizeTokenSet;
    default:
      return undefined;
  }
}

const transformBackgroundTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'BACKGROUND'
    ? {
      [getCssVariableName({ component, part, property: 'background', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaFillsToCssColor(tokenSet.background).color,
        property: 'background',
      },
    } : {}
}

const transformSpacingTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'SPACING'
    ? {
      // Padding
      [getCssVariableName({ component, part, property: 'padding-y', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.TOP}px`,
        property: 'vertical padding',
      },
      [getCssVariableName({ component, part, property: 'padding-x', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'horizontal padding',
      },
      [getCssVariableName({ component, part, property: 'padding-top', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.TOP}px`,
        property: 'padding-top'
      },
      [getCssVariableName({ component, part, property: 'padding-right', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.RIGHT}px`,
        property: 'padding-right'
      },
      [getCssVariableName({ component, part, property: 'padding-bottom', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.BOTTOM}px`,
        property: 'padding-bottom'
      },
      [getCssVariableName({ component, part, property: 'padding-left', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-left'
      },
      [getCssVariableName({ component, part, property: 'padding-start', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.LEFT}px`,
        property: 'padding-start'
      },
      [getCssVariableName({ component, part, property: 'padding-end', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.padding.RIGHT}px`,
        property: 'padding-end'
      },
      [getCssVariableName({ component, part, property: 'spacing', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.spacing}px`,
        property: 'spacing'
      },
    } : {}
}

const transformBorderTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'BORDER'
    ? {
      [getCssVariableName({ component, part, property: 'border-width', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.weight}px`,
        property: 'border-width'
      },
      [getCssVariableName({ component, part, property: 'border-radius', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.radius}px`,
        property: 'border-radius'
      },
      [getCssVariableName({ component, part, property: 'border-color', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaFillsToCssColor(tokenSet.strokes).color,
        property: 'border-color'
      },
    } : {}
}

const transformTypographyTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'TYPOGRAPHY'
    ? {
      [getCssVariableName({ component, part, property: 'font-family', theme: params.theme, type: params.type, state: params.state })]: {
        value: `'${tokenSet.fontFamily}'`,
        property: 'font-family'
      },
      [getCssVariableName({ component, part, property: 'font-size', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.fontSize}px`,
        property: 'font-size'
      },
      [getCssVariableName({ component, part, property: 'font-weight', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.fontWeight}`,
        property: 'font-weight'
      },
      [getCssVariableName({ component, part, property: 'line-height', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.lineHeight}`,
        property: 'line-height'
      },
      [getCssVariableName({ component, part, property: 'letter-spacing', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.letterSpacing}px`,
        property: 'letter-spacing'
      },
      [getCssVariableName({ component, part, property: 'text-align', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
        property: 'text-align'
      },
      [getCssVariableName({ component, part, property: 'text-decoration', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaTextDecorationToCss(tokenSet.textDecoration),
        property: 'text-decoration'
      },
      [getCssVariableName({ component, part, property: 'text-transform', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
        property: 'text-transform'
      },
    } : {}
}

const transformFillTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'FILL'
    ? {
      [getCssVariableName({ component, part, property: 'color', theme: params.theme, type: params.type, state: params.state })]: {
        value: transformFigmaFillsToCssColor(tokenSet.color).color,
        property: 'color'
      },
    } : {}
}

const transformEffectTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'EFFECT'
    ? {
      [getCssVariableName({ component, part, property: 'box-shadow', theme: params.theme, type: params.type, state: params.state })]: {
        value: tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
        property: 'color'
      },
    } : {}
}

const transformOpacityTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'OPACITY'
    ? {
      [getCssVariableName({ component, part, property: 'opacity', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.opacity}`,
        property: 'opacity',
      },
    } : {}
}

const transformSizeTokenSet = (component: string, part: string, tokenSet: TokenSet, params: TransformerParams): Record<string, ValueProperty> => {
  return tokenSet.name === 'SIZE'
    ? {
      [getCssVariableName({ component, part, property: 'width', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.width ?? '0'}px`,
        property: 'width',
      },
      [getCssVariableName({ component, part, property: 'height', theme: params.theme, type: params.type, state: params.state })]: {
        value: `${tokenSet.height ?? '0'}px`,
        property: 'height',
      },
    } : {}
}

interface TransformerParams { theme: string | undefined, type: string | undefined, state: string | undefined };