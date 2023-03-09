import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, isValidTheme, normalizeNamePart } from '../utils';

export type PaginationComponents = PaginationComponent[];

export interface PaginationComponentTokens {
  id: string;

  // Description
  description: string;

  // Background
  background: FigmaTypes.Paint[];

  // Border
  borderWeight: number;
  borderRadius: number;
  borderColor: FigmaTypes.Paint[];

  // Spacing
  spacing: number | undefined;

  parts: {
    // Previous
    previous: {
      // Background
      background: FigmaTypes.Paint[];

      // Border
      borderWeight: number;
      borderRadius: number;
      borderColor: FigmaTypes.Paint[];

      // Padding
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;

      // Typography
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
    };

    // Next
    next: {
      // Background
      background: FigmaTypes.Paint[];

      // Border
      borderWeight: number;
      borderRadius: number;
      borderColor: FigmaTypes.Paint[];

      // Padding
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;

      // Typography
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
    };

    // Item
    item: {
      // Background
      background: FigmaTypes.Paint[];

      // Border
      borderWeight: number;
      borderRadius: number;
      borderColor: FigmaTypes.Paint[];

      // Padding
      paddingTop: number;
      paddingRight: number;
      paddingBottom: number;
      paddingLeft: number;

      // Typography
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
    };
  };
}

export interface PaginationDesignComponent extends PaginationComponentTokens {
  componentType: 'design';
  /**
   * Component theme (light, dark)
   *
   * @default 'light'
   */
  theme: 'light' | 'dark';
  /**
   * Component state (default, hover, disabled)
   *
   * @default 'Default'
   */
  state: 'default' | 'hover' | 'disabled' | 'active';
}

export interface PaginationLayoutComponent extends PaginationComponentTokens {
  componentType: 'layout';
  /**
   * Component size (xl, lg, md, sm, xs)
   */
  size: string;
}

export type PaginationComponent = PaginationDesignComponent | PaginationLayoutComponent;

const isValidState = (state: string): state is PaginationDesignComponent['state'] => {
  return ['default', 'hover', 'disabled', 'active'].includes(state);
};

export default function extractPaginationComponents(paginationComponents: GetComponentSetComponentsResult): PaginationComponents {
  return paginationComponents.components
    .map((paginationComponent): PaginationComponent | null => {
      const theme = normalizeNamePart(getComponentNamePart(paginationComponent.name, 'Theme') ?? 'light');
      const state = normalizeNamePart(getComponentNamePart(paginationComponent.name, 'State') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(paginationComponent.name, 'Size') ?? '');

      const instanceNode = size ? paginationComponent : findChildNodeWithType(paginationComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for pagination component ${paginationComponent.name}`);
      }

      const previousNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Previous');
      if (!previousNode) {
        throw new Error(`No previous node found for pagination component ${paginationComponent.name}`);
      }

      const previousNodeText = findChildNodeWithType(previousNode, 'TEXT');
      if (!previousNodeText) {
        throw new Error(`No previous text node found for pagination component ${paginationComponent.name}`);
      }

      const nextNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Next');
      if (!nextNode) {
        throw new Error(`No next node found for pagination component ${paginationComponent.name}`);
      }

      const nextNodeText = findChildNodeWithType(nextNode, 'TEXT');
      if (!nextNodeText) {
        throw new Error(`No next text node found for pagination component ${paginationComponent.name}`);
      }

      const itemNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Item');
      if (!itemNode) {
        throw new Error(`No item node found for pagination component ${paginationComponent.name}`);
      }

      const itemNodeText = findChildNodeWithType(itemNode, 'TEXT');
      if (!itemNodeText) {
        throw new Error(`No item text node found for pagination component ${paginationComponent.name}`);
      }

      // Description
      const description = paginationComponents.metadata[paginationComponent.id]?.description ?? '';

      // Background color
      const background = instanceNode.fills.slice();

      // Border
      const borderWeight = instanceNode.strokeWeight ?? 0;
      const borderRadius = instanceNode.cornerRadius ?? 0;
      const borderColor = instanceNode.strokes.slice();

      // Spacing
      const spacing = instanceNode.layoutMode === 'HORIZONTAL' ? instanceNode.itemSpacing : undefined;

      // Previous
      const previous = {
        // Background
        background: previousNode.fills.slice(),

        // Border
        borderWeight: previousNode.strokeWeight ?? 0,
        borderRadius: previousNode.cornerRadius ?? 0,
        borderColor: previousNode.strokes.slice(),

        // Padding
        paddingTop: previousNode.paddingTop ?? 0,
        paddingRight: previousNode.paddingRight ?? 0,
        paddingBottom: previousNode.paddingBottom ?? 0,
        paddingLeft: previousNode.paddingLeft ?? 0,

        // Typography
        fontFamily: previousNodeText.style.fontFamily,
        fontSize: previousNodeText.style.fontSize,
        fontWeight: previousNodeText.style.fontWeight,
        lineHeight: (previousNodeText.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: previousNodeText.style.letterSpacing,
        textAlign: previousNodeText.style.textAlignHorizontal,
        textDecoration: previousNodeText.style.textDecoration,
        textCase: previousNodeText.style.textCase,
        color: previousNodeText.fills.slice(),
      };

      // Next
      const next = {
        // Background
        background: nextNode.fills.slice(),

        // Border
        borderWeight: nextNode.strokeWeight ?? 0,
        borderRadius: nextNode.cornerRadius ?? 0,
        borderColor: nextNode.strokes.slice(),

        // Padding
        paddingTop: nextNode.paddingTop ?? 0,
        paddingRight: nextNode.paddingRight ?? 0,
        paddingBottom: nextNode.paddingBottom ?? 0,
        paddingLeft: nextNode.paddingLeft ?? 0,

        // Typography
        fontFamily: nextNodeText.style.fontFamily,
        fontSize: nextNodeText.style.fontSize,
        fontWeight: nextNodeText.style.fontWeight,
        lineHeight: (nextNodeText.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: nextNodeText.style.letterSpacing,
        textAlign: nextNodeText.style.textAlignHorizontal,
        textDecoration: nextNodeText.style.textDecoration,
        textCase: nextNodeText.style.textCase,
        color: nextNodeText.fills.slice(),
      };

      // Item
      const item = {
        // Background
        background: itemNode.fills.slice(),

        // Border
        borderWeight: itemNode.strokeWeight ?? 0,
        borderRadius: itemNode.cornerRadius ?? 0,
        borderColor: itemNode.strokes.slice(),

        // Padding
        paddingTop: itemNode.paddingTop ?? 0,
        paddingRight: itemNode.paddingRight ?? 0,
        paddingBottom: itemNode.paddingBottom ?? 0,
        paddingLeft: itemNode.paddingLeft ?? 0,

        // Typography
        fontFamily: itemNodeText.style.fontFamily,
        fontSize: itemNodeText.style.fontSize,
        fontWeight: itemNodeText.style.fontWeight,
        lineHeight: (itemNodeText.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: itemNodeText.style.letterSpacing,
        textAlign: itemNodeText.style.textAlignHorizontal,
        textDecoration: itemNodeText.style.textDecoration ?? 'NONE',
        textCase: itemNodeText.style.textCase ?? 'ORIGINAL',
        color: itemNodeText.fills.slice(),
      };

      const tokens: Omit<PaginationComponentTokens, 'id'> = {
        description,
        background,
        borderWeight,
        borderRadius,
        borderColor,
        spacing,
        parts: {
          previous,
          next,
          item,
        },
      };

      if (size) {
        return {
          id: `layout-size-${size}`,
          componentType: 'layout',
          size,
          ...tokens,
        };
      }

      if (!isValidTheme(theme) || !isValidState(state)) {
        return null;
      }

      return {
        id: `design-theme-${theme}-state-${state}`,
        componentType: 'design',
        theme,
        state,
        ...tokens,
      };
    })
    .filter(filterOutNull);
}
