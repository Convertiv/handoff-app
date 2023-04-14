import { AlertComponent } from '../../../exporters/components/component_sets/alert';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextCaseToCssTextTransform,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';

enum Part {
  Alert    = 'alert',
  Close    = 'close',
  Icon     = 'icon',
  Body     = 'body',
  Content  = 'content',
  Title    = 'title',
  Text     = 'text',
  Actions  = 'actions',
}

export const transformAlertComponentTokensToScssVariables = (tokens: AlertComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.layout;
  const theme = 'light';
  const state = 'default';

  return {
    /**
     * Main part
     */
    // Background
    [getScssVariableName({ component: 'alert', part: '', property: 'background', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Part.Alert,
    },
    // Padding
    [getScssVariableName({ component: 'alert', part: '', property: 'padding-top', theme, type, state })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Part.Alert,
    },
    [getScssVariableName({ component: 'alert', part: '', property: 'padding-right', theme, type, state })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Part.Alert,
    },
    [getScssVariableName({ component: 'alert', part: '', property: 'padding-bottom', theme, type, state })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Part.Alert,
    },
    [getScssVariableName({ component: 'alert', part: '', property: 'padding-left', theme, type, state })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Part.Alert,
    },
    // Border
    [getScssVariableName({ component: 'alert', part: '', property: 'border-width', theme, type, state })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Part.Alert,
    },
    [getScssVariableName({ component: 'alert', part: '', property: 'border-radius', theme, type, state })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Part.Alert,
    },
    [getScssVariableName({ component: 'alert', part: '', property: 'border-color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Part.Alert,
    },
    // Box shadow
    [getScssVariableName({ component: 'alert', part: '', property: 'box-shadow', theme, type, state })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Part.Alert,
    },
    // Spacing
    [getScssVariableName({ component: 'alert', part: '', property: 'spacing', theme, type, state })]: {
      value: `${tokens.spacing}px`,
      property: 'spacing',
      group: Part.Alert,
    },
    /**
     * Close part
     */
    [getScssVariableName({ component: 'alert', part: 'close', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.close.color).color,
      property: 'color',
      group: Part.Close,
    },
    /**
     * Icon part
     */
    [getScssVariableName({ component: 'alert', part: 'icon', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.icon.color).color,
      property: 'color',
      group: Part.Icon,
    },
    /**
     * Body part
     */
    [getScssVariableName({ component: 'alert', part: 'body', property: 'spacing', theme, type, state })]: {
      value: `${tokens.parts.body.spacing}px`,
      property: 'spacing',
      group: Part.Body,
    },
    /**
     * Content part
     */
    [getScssVariableName({ component: 'alert', part: 'content', property: 'spacing', theme, type, state })]: {
      value: `${tokens.parts.content.spacing}px`,
      property: 'spacing',
      group: Part.Content,
    },
    /**
     * Title part
     */
    [getScssVariableName({ component: 'alert', part: 'title', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.title.fontFamily}'`,
      property: 'font-family',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.title.fontSize}px`,
      property: 'font-size',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.title.fontWeight}`,
      property: 'font-weight',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.title.lineHeight}`,
      property: 'line-height',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.title.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.title.textAlign),
      property: 'text-align',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.title.textDecoration),
      property: 'text-decoration',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.title.textCase),
      property: 'text-transform',
      group: Part.Title,
    },
    [getScssVariableName({ component: 'alert', part: 'title', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.title.color).color,
      property: 'color',
      group: Part.Title,
    },
    /**
     * Text part
     */
    [getScssVariableName({ component: 'alert', part: 'text', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.text.fontFamily}'`,
      property: 'font-family',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.text.fontSize}px`,
      property: 'font-size',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'font-weight', theme, type, state })]: { 
      value: `${tokens.parts.text.fontWeight}`,
      property: 'font-weight',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.text.lineHeight}`,
      property: 'line-height',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.text.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'text-align',theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.text.textAlign),
      property: 'text-align',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.text.textDecoration),
      property: 'text-decoration',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.text.textCase),
      property: 'text-transform',
      group: Part.Text,
    },
    [getScssVariableName({ component: 'alert', part: 'text', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.text.color).color,
      property: 'color',
      group: Part.Text,
    },
    /**
     * Actions part
     */
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'spacing', theme, type, state })]: {
      value: `${tokens.parts.actions.spacing}px`,
      property: 'margin-left',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'font-family', theme, type, state })]: {
      value: `'${tokens.parts.actions.fontFamily}'`,
      property: 'font-family',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'font-size', theme, type, state })]: {
      value: `${tokens.parts.actions.fontSize}px`,
      property: 'font-size',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'font-weight', theme, type, state })]: {
      value: `${tokens.parts.actions.fontWeight}`,
      property: 'font-weight',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'line-height', theme, type, state })]: {
      value: `${tokens.parts.actions.lineHeight}`,
      property: 'line-height',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'letter-spacing', theme, type, state })]: {
      value: `${tokens.parts.actions.letterSpacing}px`,
      property: 'letter-spacing',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'text-align', theme, type, state })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.actions.textAlign),
      property: 'text-align',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'text-decoration', theme, type, state })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.actions.textDecoration),
      property: 'text-decoration',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'text-transform', theme, type, state })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokens.parts.actions.textCase),
      property: 'text-transform',
      group: Part.Actions,
    },
    [getScssVariableName({ component: 'alert', part: 'actions', property: 'color', theme, type, state })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.actions.color).color,
      property: 'color',
      group: Part.Actions,
    },
  };
};
