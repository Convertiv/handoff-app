import { RadioComponent, RadioComponents } from '../../../exporters/components/component_sets/radio';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import {
  cssCodeBlockComment,
  getSizesFromComponents,
  getStatesFromComponents,
  getThemesFromComponents,
  getTypesFromComponents,
  transformFigmaColorToCssColor,
} from '../utils';
import { mapComponentSize } from '../../../utils';

export const transformRadioComponentsToCssVariables = (radios: RadioComponents): string => {
  const lines = [];
  lines.push(
    `$radio-sizes: ( ${getSizesFromComponents(radios)
      .map((type) => `"${mapComponentSize(type)}"`)
      .join(', ')} );`
  );
  lines.push(
    `$radio-themes: ( ${getThemesFromComponents(radios)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$radio-states: ( ${getStatesFromComponents(radios)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  lines.push('.radio {');
  const cssVars = radios.map(
    (radio) =>
      `  ${cssCodeBlockComment('radio', radio)}\n ${Object.entries(transformRadioComponentTokensToCssVariables(radio))
        .map(([variable, value]) => `  ${variable}: ${value.value};`)
        .join('\n')}`
  );
  return lines.concat(cssVars).join('\n\n') + '\n}';
};

export const transformRadioComponentTokensToCssVariables = (tokens: RadioComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.state : tokens.size;
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';

  return {
    // Button background
    [getCssVariableName({ component: 'radio', property: 'background', part: '', type, theme, state })]: {
      property: 'background',
      value: transformFigmaFillsToCssColor(tokens.parts.check.background).color,
    },
    // Size
    [getCssVariableName({ component: 'radio', property: 'width', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'radio', property: 'width-raw', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'radio', property: 'height', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'radio', property: 'height-raw', part: '', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw',
    },
    // Padding
    [getCssVariableName({ component: 'radio', property: 'padding-y', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'vertical padding',
    },
    [getCssVariableName({ component: 'radio', property: 'padding-x', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'horizontal padding',
    },
    [getCssVariableName({ component: 'radio', property: 'padding-top', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'top padding',
    },
    [getCssVariableName({ component: 'radio', property: 'padding-right', type, theme, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'right padding',
    },
    [getCssVariableName({ component: 'radio', property: 'padding-bottom', type, theme, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'bottom padding',
    },
    [getCssVariableName({ component: 'radio', property: 'padding-left', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'left padding',
    },
    [getCssVariableName({ component: 'radio', property: 'padding-start', type, theme, state })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'radio left padding',
    },
    // Border
    [getCssVariableName({ component: 'radio', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border width',
    },
    [getCssVariableName({ component: 'radio', property: 'border-radius', type, theme, state })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border radius',
    },
    [getCssVariableName({ component: 'radio', property: 'border-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border color',
    },
    // Opacity
    [getCssVariableName({ component: 'radio', property: 'opacity', type, theme, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
    },
    // Box shadow
    [getCssVariableName({ component: 'radio', property: 'box-shadow', type, theme, state })]: {
      value: tokens.parts.check.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box shadow',
    },
    /**
     * Label part
     */
    [getCssVariableName({ component: 'radio', part: 'label', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font family',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font size',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font weight',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line height',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter spacing',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text alignment',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text decoration',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text transformation',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'text color',
    },
    [getCssVariableName({ component: 'radio', part: 'label', property: 'opacity', type, theme, state })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
    },
    /**
     * Thumb part
     */
    // Size
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'width', type, theme, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'width-raw', type, theme, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'height', type, theme, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'height-raw', type, theme, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw',
    },
    // Background
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'background', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.thumb.background).color,
      property: 'background',
    },
    // Border
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'radio', part: 'thumb', property: 'border-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.thumb.borderColor).color,
      property: 'border-color',
    },
  };
};
