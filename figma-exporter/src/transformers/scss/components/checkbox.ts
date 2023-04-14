import { CheckboxComponent } from '../../../exporters/components/component_sets/checkbox';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { transformFigmaColorToCssColor } from '../../css/utils';

enum Part {
  Checkbox  = 'checkbox',
  Icon      = 'icon',
  Label     = 'label',
}

export const transformCheckboxComponentTokensToScssVariables = (tokens: CheckboxComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.state : tokens.size;
  const theme = 'light';
  const state = tokens.componentType === 'design' ? tokens.activity : 'off';

  return {
    /**
     * Checkbox part
     */
    // Button background
    [getScssVariableName({ component: 'checkbox', part: '', property: 'background', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.background).color,
      property: 'background',
      group: Part.Checkbox,
    },
    // Size
    [getScssVariableName({ component: 'checkbox', part: '', property: 'width', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}px`,
      property: 'width',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', part: '', property: 'width-raw', type, theme, state })]: {
      value: `${tokens.parts.check.width ?? '0'}`,
      property: 'width-raw',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', part: '', property: 'height', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}px`,
      property: 'height',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', part: '', property: 'height-raw', type, theme, state })]: {
      value: `${tokens.parts.check.height ?? '0'}`,
      property: 'height-raw',
      group: Part.Checkbox,
    },
    // Icon Color
    [getScssVariableName({ component: 'checkbox', property: 'icon-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.color).color,
      property: 'icon-color',
      group: Part.Checkbox,
    },
    // Opacity
    [getScssVariableName({ component: 'checkbox', property: 'opacity', type, theme, state })]: {
      value: `${tokens.opacity}`,
      property: 'opacity',
      group: Part.Checkbox,
    },
    // Padding
    [getScssVariableName({ component: 'checkbox', property: 'padding-y', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-vertical',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'padding-x', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-horizontal',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'padding-top', type, theme, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'padding-right', type, theme, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'padding-bottom', type, theme, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'padding-left', type, theme, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'padding-start', type, theme, state })]: {
      value: `${tokens.parts.check.paddingLeft}px`,
      property: 'padding-start',
      group: Part.Checkbox,
    },
    // Border
    [getScssVariableName({ component: 'checkbox', property: 'border-width', type, theme, state })]: {
      value: `${tokens.parts.check.borderWeight}px`,
      property: 'border-width',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'border-radius', type, theme, state })]: {
      value: `${tokens.parts.check.borderRadius}px`,
      property: 'border-radius',
      group: Part.Checkbox,
    },
    [getScssVariableName({ component: 'checkbox', property: 'border-color', type, theme, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.check.borderColor).color,
      property: 'border-color',
      group: Part.Checkbox,
    },
    // Box shadow
    [getScssVariableName({ component: 'checkbox', property: 'box-shadow', type, theme, state })]: {
      value: tokens.parts.check.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part.Checkbox,
    },
    /**
     * Icon part
     */
    // Size
    [getScssVariableName({ component: 'checkbox', part: 'icon', property: 'width', type, theme, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}px`,
      property: 'width',
      group: Part.Icon,
    },
    [getScssVariableName({ component: 'checkbox', part: 'icon', property: 'width-raw', type, theme, state })]: {
      value: `${tokens.parts.icon.width ?? '0'}`,
      property: 'width-raw',
      group: Part.Icon,
    },
    [getScssVariableName({ component: 'checkbox', part: 'icon', property: 'height', type, theme, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}px`,
      property: 'height',
      group: Part.Icon,
    },
    [getScssVariableName({ component: 'checkbox', part: 'icon', property: 'height-raw', type, theme, state })]: {
      value: `${tokens.parts.icon.height ?? '0'}`,
      property: 'height-raw',
      group: Part.Icon,
    },
    /**
     * Label part
     */
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'spacing',
      group: Part.Label
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'font-family', type, theme, state })]: {
      value: `'${tokens.parts.label.fontFamily}'`,
      property: 'font-family',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'font-size', type, theme, state })]: {
      value: `${tokens.parts.label.fontSize}px`,
      property: 'font-size',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'font-weight', type, theme, state })]: {
      value: `${tokens.parts.label.fontWeight}`,
      property: 'font-weight',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'line-height', type, theme, state })]: {
      value: `${tokens.parts.label.lineHeight}`,
      property: 'line-height',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'letter-spacing', type, theme, state })]: {
      value: `${tokens.parts.label.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'text-align', type, theme, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.label.textAlign),
      property: 'text-align',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'text-decoration', type, theme, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.label.textDecoration),
      property: 'text-decoration',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'text-transform', type, theme, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.label.textCase),
      property: 'text-transform',
      group: Part.Label,
    },
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'color', type, theme, state })]: {
      value: transformFigmaColorToCssColor(tokens.parts.label.color),
      property: 'color',
      group: Part.Label,
    },
    // Opacity
    [getScssVariableName({ component: 'checkbox', part: 'label', property: 'opacity', type, theme, state })]: {
      value: `${tokens.parts.label.opacity}`,
      property: 'opacity',
      group: Part.Label,
    },
  };
};
