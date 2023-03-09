import { SwitchComponent, SwitchComponents } from '../../../exporters/components/component_sets/switch';
import { ValueProperty } from '../types';
import {
  cssCodeBlockComment,
  getCssVariableName,
  getSizesFromComponents,
  getStatesFromComponents,
  getThemesFromComponents,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaPaintToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { mapComponentSize } from '../../../utils';
export const transformSwitchesComponentsToCssVariables = (switches: SwitchComponents): string => {
  const lines = [];
  lines.push(
    `$switch-sizes: ( ${getSizesFromComponents(switches)
      .map((type) => `"${mapComponentSize(type)}"`)
      .join(', ')} );`
  );
  lines.push(
    `$switch-themes: ( ${getThemesFromComponents(switches)
      .map((type) => `"${type}"`)
      .join(', ')} );`
  );
  lines.push(
    `$switch-states: ( ${getStatesFromComponents(switches)
      .map((type) => `"${type == 'default' ? '' : type}"`)
      .join(', ')} );`
  );
  lines.push('.switch {');
  const cssVars = switches.map((component) => `  ${cssCodeBlockComment('switch', component)}\n ${Object.entries(transformSwitchComponentTokensToCssVariables(component))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}';
};

export const transformSwitchComponentTokensToCssVariables = (tokens: SwitchComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.state : tokens.size;
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';

  return {
    /**
     * SWITCH PART
     */
    // Spacing
    [getCssVariableName({ component: 'switch', property: 'padding-start', theme, type, state })]: {
      value: `${tokens.spacing ?? '0'}px`,
      property: 'padding-start',
    },
    // Size
    [getCssVariableName({ component: 'switch', property: 'width', theme, type, state })]: {
      value: `${tokens.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'switch', property: 'width-raw', theme, type, state })]: {
      value: `${tokens.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'switch', property: 'height', theme, type, state })]: {
      value: `${tokens.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'switch', property: 'height-raw', theme, type, state })]: {
      value: `${tokens.height ?? '0'}`,
      property: 'height-raw',
    },
    // Background
    [getCssVariableName({ component: 'switch', property: 'background', theme, type, state })]: {
      value: tokens.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },
    // Border
    [getCssVariableName({ component: 'switch', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'switch', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'switch', property: 'border-color', theme, type, state })]: {
      value: tokens.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },
    // Opacity
    [getCssVariableName({ component: 'switch', property: 'opacity', theme, type, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
    },
    // Box shadow
    [getCssVariableName({ component: 'switch', property: 'box-shadow', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },
    /**
     * LABEL PART
     */
    [getCssVariableName({ component: 'switch', part: 'label', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family'
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size'
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight'
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height'
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
    },
    [getCssVariableName({ component: 'switch', part: 'label', property: 'color', theme, type, state })]: {
      value: tokens.parts.label.color.map(transformFigmaPaintToCssColor).find(Boolean) || 'transparent',
      property: 'color',
    },
    // Opacity
    [getCssVariableName({ component: 'switch', part: 'label', property: 'opacity', theme, type, state })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
    },
    /**
     * THUMB PART
     */
    // Size
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'width', theme, type, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}px`,
      property: 'width',
    },
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'width-raw', theme, type, state })]: {
      value: `${tokens.parts.thumb.width ?? '0'}`,
      property: 'width-raw',
    },
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'height', theme, type, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}px`,
      property: 'height',
    },
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'height-raw', theme, type, state })]: {
      value: `${tokens.parts.thumb.height ?? '0'}`,
      property: 'height-raw',
    },
    // Background
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'background', theme, type, state })]: {
      value: tokens.parts.thumb.background.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'background',
    },
    // Border
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'border-width', theme, type, state })]: {
      value: `${tokens.parts.thumb.borderWeight}px`,
      property: 'border-width'
    },
    [getCssVariableName({ component: 'switch', part: 'thumb', property: 'border-color', theme, type, state })]: {
      value: tokens.parts.thumb.borderColor.map(transformFigmaPaintToCssColor).filter(Boolean).join(', ') || 'transparent',
      property: 'border-color',
    },
  };
};
