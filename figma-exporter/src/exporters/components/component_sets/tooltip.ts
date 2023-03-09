import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, normalizeNamePart } from '../utils';

export type TooltipComponents = TooltipComponent[];

export interface TooltipComponentTokens {
  id: string;

  // Description
  description: string;

  // Background
  background: FigmaTypes.Paint[];

  // Padding
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // Border
  borderWeight: number;
  borderRadius: number;
  borderColor: FigmaTypes.Color;

  parts: {
    // Label
    label: {
      characters: string;
      spacing: number | undefined;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textTransform: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Color;
    };
  };
}

export interface TooltipComponent extends TooltipComponentTokens {
  /**
   * Component vertical position
   *
   * @default 'top'
   */
  vertical: 'top' | 'bottom';
  /**
   * Horizontal position
   *
   * @default 'center'
   */
  horizontal: 'left' | 'center' | 'right';
}

const isValidVertical = (vertical: string): vertical is TooltipComponent['vertical'] => {
  return ['top', 'bottom'].includes(vertical);
};

const isValidHorizontal = (horizontal: string): horizontal is TooltipComponent['horizontal'] => {
  return ['left', 'center', 'right'].includes(horizontal);
};

export default function extractTooltipComponents(tooltipComponents: GetComponentSetComponentsResult): TooltipComponents {
  return tooltipComponents.components.map((tooltipComponent): TooltipComponent => {
    const vertical = normalizeNamePart(getComponentNamePart(tooltipComponent.name, 'Vertical') ?? 'top');
    const horizontal = normalizeNamePart(getComponentNamePart(tooltipComponent.name, 'Horizontal') ?? 'center');

    if (!isValidVertical(vertical) || !isValidHorizontal(horizontal)) {
      throw Error('Invalid horizontal or vertical type');
    }
    const instanceNode = findChildNodeWithType(tooltipComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for select component ${tooltipComponent.name}`);
    }

    const toolTipNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'body');
    if (!toolTipNode) {
      throw new Error(`No text frame found for tooltip component ${tooltipComponent.name}`);
    }

    const textNode = findChildNodeWithType(instanceNode, 'TEXT');
    if (!textNode) {
      throw new Error(`No text node found for text node ${tooltipComponent.name}`);
    }

    // Description
    const description = tooltipComponents.metadata[tooltipComponent.id]?.description ?? '';

    // Background color
    const background = toolTipNode.background.slice();

    // Padding
    const paddingTop = toolTipNode.paddingTop ?? 0;
    const paddingRight = toolTipNode.paddingRight ?? 0;
    const paddingBottom = toolTipNode.paddingBottom ?? 0;
    const paddingLeft = toolTipNode.paddingLeft ?? 0;

    // Border
    const borderWeight = instanceNode.strokeWeight ?? 0;
    const borderRadius = toolTipNode.cornerRadius ?? 0;
    const borderColor = toolTipNode.strokes[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 };

    // Label
    const label = {
      characters: textNode.characters ?? '',
      spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
      fontFamily: textNode.style.fontFamily,
      fontSize: textNode.style.fontSize,
      fontWeight: textNode.style.fontWeight,
      lineHeight: (textNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: textNode.style.letterSpacing,
      textAlign: textNode.style.textAlignHorizontal,
      textDecoration: textNode.style.textDecoration ?? 'NONE',
      textTransform: textNode.style.textCase ?? 'ORIGINAL',
      color: textNode.fills[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 },
    };

    return {
      id: `design-vertical-${vertical}-horizontal-${horizontal}`,
      description,
      vertical,
      horizontal,
      background,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      borderWeight,
      borderRadius,
      borderColor,
      parts: {
        label,
      },
    };
  });
}
