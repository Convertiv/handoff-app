import { ModalComponent } from '../../../exporters/components/component_sets/modal';
import { ValueProperty } from '../types';
import {
  getScssVariableName,
  transformFigmaEffectToCssBoxShadow,
  transformFigmaFillsToCssColor,
  transformFigmaTextAlignToCss,
  transformFigmaTextDecorationToCss,
} from '../../../utils/convertColor';

enum Parts {
  Modal   = 'modal',
  Header  = 'header',
  Title   = 'title',
  Body    = 'body',
  Footer  = 'footer',
}

export const transformModalComponentTokensToScssVariables = ({ ...tokens }: ModalComponent): Record<string, ValueProperty> => {
  const type = tokens.componentType === 'design' ? tokens.type : tokens.size;

  return {
    /**
     * Main part
     */
    // Background
    [getScssVariableName({ component: 'modal', part: '', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.background).color,
      property: 'background',
      group: Parts.Modal,
    },
    // Padding
    [getScssVariableName({ component: 'modal', part: '', property: 'padding-y', type })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-y',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'padding-x', type })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-x',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'padding-top', type })]: {
      value: `${tokens.paddingTop}px`,
      property: 'padding-top',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'padding-right', type })]: {
      value: `${tokens.paddingRight}px`,
      property: 'padding-right',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'padding-bottom', type })]: {
      value: `${tokens.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'padding-left', type })]: {
      value: `${tokens.paddingLeft}px`,
      property: 'padding-left',
      group: Parts.Modal,
    },
    // Border
    [getScssVariableName({ component: 'modal', part: '', property: 'border-width', type })]: {
      value: `${tokens.borderWeight}px`,
      property: 'border-width',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'border-radius', type })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'border-radius-sm', type })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'border-radius-lg', type })]: {
      value: `${tokens.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts.Modal,
    },
    [getScssVariableName({ component: 'modal', part: '', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.borderColor).color,
      property: 'border-color',
      group: Parts.Modal,
    },
    // Box shadow
    [getScssVariableName({ component: 'modal', part: '', property: 'box-shadow', type })]: {
      value: tokens.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts.Modal,
    },
    /**
     * Header part
     */
    // Background
    [getScssVariableName({ component: 'modal', part: 'header', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.header.background).color,
      property: 'background',
      group: Parts.Header,
    },
    // Padding
    [getScssVariableName({ component: 'modal', part: 'header', property: 'padding-y', type })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-y',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'padding-x', type })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-x',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'padding-top', type })]: {
      value: `${tokens.parts.header.paddingTop}px`,
      property: 'padding-top',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'padding-right', type })]: {
      value: `${tokens.parts.header.paddingRight}px`,
      property: 'padding-right',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'padding-bottom', type })]: {
      value: `${tokens.parts.header.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'padding-left', type })]: {
      value: `${tokens.parts.header.paddingLeft}px`,
      property: 'padding-left',
      group: Parts.Header,
    },
    // Border
    [getScssVariableName({ component: 'modal', part: 'header', property: 'border-width', type })]: {
      value: `${tokens.parts.header.borderWeight}px`,
      property: 'border-width',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'border-radius', type })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'border-radius-sm', type })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'border-radius-lg', type })]: {
      value: `${tokens.parts.header.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts.Header,
    },
    [getScssVariableName({ component: 'modal', part: 'header', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.header.borderColor).color,
      property: 'border-color',
      group: Parts.Header,
    },
    // Box shadow
    [getScssVariableName({ component: 'modal', part: 'header', property: 'box-shadow', type })]: {
      value: tokens.parts.header.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts.Header,
    },
    /**
     * Title part
     */
    // Font
    [getScssVariableName({ component: 'modal', part: 'title', property: 'font-family', type })]: {
      value: `'${tokens.parts.header.title.fontFamily}'`,
      property: 'font-family',
      group: Parts.Title,
    },
    [getScssVariableName({ component: 'modal', part: 'title', property: 'font-size', type })]: {
      value: `${tokens.parts.header.title.fontSize}px`,
      property: 'font-size',
      group: Parts.Title,
    },
    [getScssVariableName({ component: 'modal', part: 'title', property: 'font-weight', type })]: {
      value: `${tokens.parts.header.title.fontWeight}`,
      property: 'font-weight',
      group: Parts.Title,
    },
    [getScssVariableName({ component: 'modal', part: 'title', property: 'line-height', type })]: {
      value: `${tokens.parts.header.title.lineHeight}`,
      property: 'line-height',
      group: Parts.Title,
    },
    [getScssVariableName({ component: 'modal', part: 'title', property: 'letter-spacing', type })]: {
      value: `${tokens.parts.header.title.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.Title,
    },
    [getScssVariableName({ component: 'modal', part: 'title', property: 'text-align', type })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.header.title.textAlign),
      property: 'text-align',
      group: Parts.Title,
    },
    [getScssVariableName({ component: 'modal', part: 'title', property: 'text-decoration', type })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.header.title.textDecoration),
      property: 'text-decoration',
      group: Parts.Title,
    },
    /**
     * Body part
     */
    // Background
    [getScssVariableName({ component: 'modal', part: 'body', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.body.background).color,
      property: 'background',
      group: Parts.Body,
    },
    // Padding
    [getScssVariableName({ component: 'modal', part: 'body', property: 'padding-y', type })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-y',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'padding-x', type })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-x',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'padding-top', type })]: {
      value: `${tokens.parts.body.paddingTop}px`,
      property: 'padding-top',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'padding-right', type })]: {
      value: `${tokens.parts.body.paddingRight}px`,
      property: 'padding-right',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'padding-bottom', type })]: {
      value: `${tokens.parts.body.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'padding-left', type })]: {
      value: `${tokens.parts.body.paddingLeft}px`,
      property: 'padding-left',
      group: Parts.Body,
    },
    // Border
    [getScssVariableName({ component: 'modal', part: 'body', property: 'border-width', type })]: {
      value: `${tokens.parts.body.borderWeight}px`,
      property: 'border-width',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'border-radius', type })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'border-radius-sm', type })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'border-radius-lg', type })]: {
      value: `${tokens.parts.body.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.body.borderColor).color,
      property: 'border-color',
      group: Parts.Body,
    },
    // Box shadow
    [getScssVariableName({ component: 'modal', part: 'body', property: 'box-shadow', type })]: {
      value: tokens.parts.body.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts.Body,
    },
    // Font
    [getScssVariableName({ component: 'modal', part: 'body', property: 'font-family', type })]: {
      value: `'${tokens.parts.body.content.fontFamily}'`,
      property: 'font-family',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'font-size', type })]: {
      value: `${tokens.parts.body.content.fontSize}px`,
      property: 'font-size',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'font-weight', type })]: {
      value: `${tokens.parts.body.content.fontWeight}`,
      property: 'font-weight',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'line-height', type })]: {
      value: `${tokens.parts.body.content.lineHeight}`,
      property: 'line-height',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'letter-spacing', type })]: {
      value: `${tokens.parts.body.content.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'text-align', type })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.body.content.textAlign),
      property: 'text-align',
      group: Parts.Body,
    },
    [getScssVariableName({ component: 'modal', part: 'body', property: 'text-decoration', type })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.body.content.textDecoration),
      property: 'text-decoration',
      group: Parts.Body,
    },
    /**
     * Footer part
     */
    // Background
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'background', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.footer.background).color,
      property: 'background',
      group: Parts.Footer,
    },
    // Padding
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'padding-y', type })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-y',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'padding-x', type })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-x',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'padding-top', type })]: {
      value: `${tokens.parts.footer.paddingTop}px`,
      property: 'padding-top',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'padding-right', type })]: {
      value: `${tokens.parts.footer.paddingRight}px`,
      property: 'padding-right',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'padding-bottom', type })]: {
      value: `${tokens.parts.footer.paddingBottom}px`,
      property: 'padding-bottom',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'padding-left', type })]: {
      value: `${tokens.parts.footer.paddingLeft}px`,
      property: 'padding-left',
      group: Parts.Footer,
    },
    // Border
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'border-width', type })]: {
      value: `${tokens.parts.footer.borderWeight}px`,
      property: 'border-width',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'border-radius', type })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'border-radius-sm', type })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-sm',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'border-radius-lg', type })]: {
      value: `${tokens.parts.footer.borderRadius}px`,
      property: 'border-radius-lg',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'border-color', type })]: {
      value: transformFigmaFillsToCssColor(tokens.parts.footer.borderColor).color,
      property: 'border-color',
      group: Parts.Footer,
    },
    // Box shadow
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'box-shadow', type })]: {
      value: tokens.parts.footer.effects.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'box-shadow',
      group: Parts.Footer,
    },
    // Font
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'font-family', type })]: {
      value: `'${tokens.parts.footer.copy.fontFamily}'`,
      property: 'font-family',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'font-size', type })]: {
      value: `${tokens.parts.footer.copy.fontSize}px`,
      property: 'font-size',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'font-weight', type })]: {
      value: `${tokens.parts.footer.copy.fontWeight}`,
      property: 'font-weight',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'line-height', type })]: {
      value: `${tokens.parts.footer.copy.lineHeight}`,
      property: 'line-height',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'letter-spacing', type })]: {
      value: `${tokens.parts.footer.copy.letterSpacing}px`,
      property: 'letter-spacing',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'text-align', type })]: {
      value: transformFigmaTextAlignToCss(tokens.parts.footer.copy.textAlign),
      property: 'text-align',
      group: Parts.Footer,
    },
    [getScssVariableName({ component: 'modal', part: 'footer', property: 'text-decoration', type })]: {
      value: transformFigmaTextDecorationToCss(tokens.parts.footer.copy.textDecoration),
      property: 'text-decoration',
      group: Parts.Footer,
    },
  };
};
