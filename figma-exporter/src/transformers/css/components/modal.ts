import { ModalComponent, ModalComponents } from '../../../exporters/components/component_sets/modal';
import { ValueProperty } from '../types';
import {
  getCssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';
import { cssCodeBlockComment } from '../utils';
import { mapComponentSize } from '../../../utils/config';

enum Parts {
  Modal  = 'modal',
  Header = 'header',
  Title  = 'title',
  Body   = 'body',
  Footer = 'footer',
}

/**
 * Transform Modal components into CSS Variables
 * @param modals
 * @returns
 */
export const transformModalComponentsToCssVariables = (modals: ModalComponents): string => {
  const lines = [];
  lines.push('.modal {')
  const cssVars = modals.map((modal) => `  ${cssCodeBlockComment('modal', modal)}\n ${Object.entries(transformModalComponentTokensToCssVariables(modal))
    .map(([variable, value]) => `  ${variable}: ${value.value};`)
    .join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

export const transformModalComponentTokensToCssVariables = ({ ...tokens }: ModalComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.type : mapComponentSize(tokens.size);

  return {
    /**
     * MODAL PART
     */
    // Background
    [getCssVariableName({ component: 'modal', part: '', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
    },
    // Padding
    [getCssVariableName({ component: 'modal', part: '', property: 'padding-y', type })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'padding-x', type })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'padding-top', type })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'padding-right', type })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'padding-bottom', type })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'padding-left', type })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
    },
    // Border
    [getCssVariableName({ component: 'modal', part: '', property: 'border-width', type })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'border-radius', type })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'border-radius-sm', type })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'border-radius-lg', type })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg',
    },
    [getCssVariableName({ component: 'modal', part: '', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
    },
    // Box shadow
    [getCssVariableName({ component: 'modal', part: '', property: 'box-shadow', type })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },
    /**
     * HEADER PART
     */
    // Background
    [getCssVariableName({ component: 'modal', part: 'header', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.header.background).color,
      property: 'background',
    },
    // Padding
    [getCssVariableName({ component: 'modal', part: 'header', property: 'padding-y', type })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-y',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'padding-x', type })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-x',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'padding-top', type })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'padding-right', type })]: {
      value: `${tokens.parts.header.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'padding-bottom', type })]: {
      value: `${tokens.parts.header.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'padding-left', type })]: {
      value: `${tokens.parts.header.paddingLeft}px`,
      property: 'padding-left',
    },
    // Border
    [getCssVariableName({ component: 'modal', part: 'header', property: 'border-width', type })]: {
      value: `${tokens.parts.header.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'border-radius', type })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'border-radius-sm', type })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-sm',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'border-radius-lg', type })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-lg',
    },
    [getCssVariableName({ component: 'modal', part: 'header', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.header.borderColor).color,
      property: 'border-color',
    },
    // Box shadow
    [getCssVariableName({ component: 'modal', part: 'header', property: 'box-shadow', type })]: {
      value: tokens.parts.header.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },
    /**
     * TITLE PART
     */
    // Font
    [getCssVariableName({ component: 'modal', part: 'title', property: 'font-family', type })]: {
      value: `'${tokens.parts.header.title.fontFamily}'`,
      property: 'font-family',
    },
    [getCssVariableName({ component: 'modal', part: 'title', property: 'font-size', type })]: {
      value: `${tokens.parts.header.title.fontSize}px`,
      property: 'font-size',
    },
    [getCssVariableName({ component: 'modal', part: 'title', property: 'font-weight', type })]: {
      value: `${tokens.parts.header.title.fontWeight}`,
      property: 'font-weight',
    },
    [getCssVariableName({ component: 'modal', part: 'title', property: 'line-height', type })]: {
      value: `${tokens.parts.header.title.lineHeight}`,
      property: 'line-height',
    },
    [getCssVariableName({ component: 'modal', part: 'title', property: 'letter-spacing', type })]: {
      value: `${tokens.parts.header.title.letterSpacing}px`,
      property: 'letter-spacing',
    },
    [getCssVariableName({ component: 'modal', part: 'title', property: 'text-align', type })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.header.title.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'modal', part: 'title', property: 'text-decoration', type })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.header.title.textDecoration),
      property: 'text-decoration',
    },
    /**
     * BODY PART
     */
    // Background
    [getCssVariableName({ component: 'modal', part: 'body', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.body.background).color,
      property: 'background',
    },
    // Padding
    [getCssVariableName({ component: 'modal', part: 'body', property: 'padding-y', type })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-y',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'padding-x', type })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-x',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'padding-top', type })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'padding-right', type })]: {
      value: `${tokens.parts.body.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'padding-bottom', type })]: {
      value: `${tokens.parts.body.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'padding-left', type })]: {
      value: `${tokens.parts.body.paddingLeft}px`,
      property: 'padding-left',
    },
    // Border
    [getCssVariableName({ component: 'modal', part: 'body', property: 'border-width', type })]: {
      value: `${tokens.parts.body.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'border-radius', type })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'border-radius-sm', type })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-sm',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'border-radius-lg', type })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-lg',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.body.borderColor).color,
      property: 'border-color',
    },
    // Box shadow
    [getCssVariableName({ component: 'modal', part: 'body', property: 'box-shadow', type })]: {
      value: tokens.parts.body.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },
    // Font
    [getCssVariableName({ component: 'modal', part: 'body', property: 'font-family', type })]: {
      value: `'${tokens.parts.body.content.fontFamily}'`,
      property: 'font-family',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'font-size', type })]: {
      value: `${tokens.parts.body.content.fontSize}px`,
      property: 'font-size',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'font-weight', type })]: {
      value: `${tokens.parts.body.content.fontWeight}`,
      property: 'font-weight',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'line-height', type })]: {
      value: `${tokens.parts.body.content.lineHeight}`,
      property: 'line-height',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'letter-spacing', type })]: {
      value: `${tokens.parts.body.content.letterSpacing}px`,
      property: 'letter-spacing',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'text-align', type })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.body.content.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'modal', part: 'body', property: 'text-decoration', type })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.body.content.textDecoration),
      property: 'text-decoration',
    },
    /**
     * FOOTER PART
     */
    // Background
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.footer.background).color,
      property: 'background',
    },
    // Padding
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'padding-y', type })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-y',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'padding-x', type })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-x',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'padding-top', type })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-top',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'padding-right', type })]: {
      value: `${tokens.parts.footer.paddingRight}px`,
      property: 'padding-right',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'padding-bottom', type })]: {
      value: `${tokens.parts.footer.paddingBottom}px`,
      property: 'padding-bottom',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'padding-left', type })]: {
      value: `${tokens.parts.footer.paddingLeft}px`,
      property: 'padding-left',
    },
    // Border
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'border-width', type })]: {
      value: `${tokens.parts.footer.borderWeight}px`,
      property: 'border-width',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'border-radius', type })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'border-radius-sm', type })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-sm',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'border-radius-lg', type })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-lg',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.footer.borderColor).color,
      property: 'border-color',
    },
    // Box shadow
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'box-shadow', type })]: {
      value: tokens.parts.footer.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
    },
    // Font
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'font-family', type })]: {
      value: `'${tokens.parts.footer.copy.fontFamily}'`,
      property: 'font-family',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'font-size', type })]: {
      value: `${tokens.parts.footer.copy.fontSize}px`,
      property: 'font-size',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'font-weight', type })]: {
      value: `${tokens.parts.footer.copy.fontWeight}`,
      property: 'font-weight',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'line-height', type })]: {
      value: `${tokens.parts.footer.copy.lineHeight}`,
      property: 'line-height',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'letter-spacing', type })]: {
      value: `${tokens.parts.footer.copy.letterSpacing}px`,
      property: 'letter-spacing',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'text-align', type })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.footer.copy.textAlign),
      property: 'text-align',
    },
    [getCssVariableName({ component: 'modal', part: 'footer', property: 'text-decoration', type })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.footer.copy.textDecoration),
      property: 'text-decoration',
    },
  };
};
