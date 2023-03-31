import { ButtonComponent, ButtonComponents } from '../../../exporters/components/component_sets/button';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { cssCodeBlockComment } from '../utils';

/**
 * Render css variables from button code
 * @param buttons
 * @returns
 */
export const transformButtonComponentsToCssVariables = (buttons: ButtonComponents): string => {
  const lines = [];
  lines.push('.btn {')
  const cssVars = buttons.map((button) => ` ${cssCodeBlockComment('button', button)}\n ${Object.entries(transformButtonComponentTokensToCssVariables(button))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Transform Buton components into Css vars
 * @param tokens
 * @returns
 */
export const transformButtonComponentTokensToCssVariables = (tokens: ButtonComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.size;
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.state : undefined;

  return {
    // Background
    [getCssVariableName({ component: 'button', property: 'background', part: '', theme, type, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },
    // Padding
    [getCssVariableName({ component: 'button', property: 'padding-top', part: '', theme, type, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'button', property: 'padding-right', part: '', theme, type, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'button', property: 'padding-bottom', part: '', theme, type, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'button', property: 'padding-left', part: '', theme, type, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
    },
    // Border
    [getCssVariableName({ component: 'button', property: 'border-width', part: '', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'button', property: 'border-radius', part: '', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'button', property: 'border-color', part: '', theme, type, state })]: {
      value: tokens.borderColor.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'border-color',
    },
    // Font
    [getCssVariableName({ component: 'button', property: 'font-family', part: '', theme, type, state })]: {
      value: `'${tokens.fontFamily}'`,
      property: 'font-family',
    },
    [getCssVariableName({ component: 'button', property: 'font-size', part: '', theme, type, state })]: {
      value: `${tokens.fontSize}px`,
      property: 'font-size',
    },
    [getCssVariableName({ component: 'button', property: 'font-weight', part: '', theme, type, state })]: {
      value: `${tokens.fontWeight}`,
      property: 'font-weight',
    },
    [getCssVariableName({ component: 'button', property: 'line-height', part: '', theme, type, state })]: {
      value: `${tokens.lineHeight}`,
      property: 'line-height',
    },
    [getCssVariableName({ component: 'button', property: 'letter-spacing', part: '', theme, type, state })]: {
      value: `${tokens.letterSpacing}px`,
      property: 'letter-spacing',
    },
    [getCssVariableName({ component: 'button', property: 'text-align', part: '', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'button', property: 'text-decoration', part: '', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'button', property: 'text-transform', part: '', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'button', property: 'color', part: '', theme, type, state })]: {
      value: tokens.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },
    // Box shadow
    [getCssVariableName({ component: 'button', property: 'box-shadow', part: '', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },
    // Opacity
    [getCssVariableName({ component: 'button', property: 'opacity', part: '', theme, type, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
    },
  };
};
