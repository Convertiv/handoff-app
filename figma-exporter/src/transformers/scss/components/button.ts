import { ButtonComponent, ButtonComponents } from '../../../exporters/components/component_sets/button';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { getSizesFromComponents, getStatesFromComponents, getThemesFromComponents, getTypesFromComponents } from '../../css/utils';
import { mapComponentSize } from '../../../utils';

enum Part {
  Button  = 'button',
}

/**
 * Transform a button to an SCSS var
 * @param buttons
 * @returns
 */
export const transformButtonComponentsToScssVariants = (buttons: ButtonComponents): string => {
  const lines = [];
  lines.push(
    `$button-variants: ( ${getTypesFromComponents(buttons)
      .map((type) => `"${type}"`)
      .join(', ')});`
  );
  lines.push(
    `$button-sizes: ( ${getSizesFromComponents(buttons)
      .map((type) => `"${mapComponentSize(type)}"`)
      .join(', ')} );`
  );
  lines.push(
    `$button-themes: ( ${getThemesFromComponents(buttons)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$button-states: ( ${getStatesFromComponents(buttons)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  return lines.join('\n\n') + '\n';
};


/**
 * Transform button components into scss vars
 * @param tokens
 * @returns
 */
export const transformButtonComponentTokensToScssVariables = (tokens: ButtonComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.size;
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    // Background
    [getScssVariableName({ component: 'button', part: '', property: 'background', theme, type, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
      group: Part.Button,
    },
    // Padding
    [getScssVariableName({ component: 'button', part: '', property: 'padding-top', theme, type, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'padding-right', theme, type, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'padding-bottom', theme, type, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'padding-left', theme, type, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part.Button,
    },
    // Border
    [getScssVariableName({ component: 'button', part: '', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'border-color', theme, type, state })]: {
      value: tokens.borderColor.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'border-color',
      group: Part.Button,
    },
    // Font
    [getScssVariableName({ component: 'button', part: '', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.fontFamily}'`,
      property: 'font-family',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'font-size', theme, type, state })]: {
      value: `${tokens.fontSize}px`,
      property: 'font-size',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.fontWeight}`,
      property: 'font-weight',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'line-height', theme, type, state })]: {
      value: `${tokens.lineHeight}`,
      property: 'line-height',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.textAlign),
      property: 'text-align',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.textDecoration),
      property: 'text-decoration',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.textCase),
      property: 'text-transform',
      group: Part.Button,
    },
    [getScssVariableName({ component: 'button', part: '', property: 'color', theme, type, state })]: {
      value: tokens.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
      group: Part.Button,
    },
    // Box shadow
    [getScssVariableName({ component: 'button', part: '', property: 'box-shadow', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part.Button,
    },
    // Opacity
    [getScssVariableName({ component: 'button', part: '', property: 'opacity', theme, type, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Part.Button,
    },
  };
};
