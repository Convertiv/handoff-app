import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, normalizeNamePart } from '../utils';

export type AlertComponents = AlertComponent[];

export interface AlertComponentTokens {
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
  borderColor: FigmaTypes.Paint[];

  // Effects
  effects: FigmaTypes.Effect[];

  // Spacing
  spacing: number;

  parts: {
    close: {
      color: FigmaTypes.Paint[];
    };
    icon: {
      color: FigmaTypes.Paint[];
    };
    body: {
      spacing: number;
    };
    content: {
      spacing: number;
    };
    title: {
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
      characters: string;
    };
    text: {
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
      characters: string;
    };
    actions: {
      spacing: number;

      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
      characters: string;
    };
  };
}

export interface AlertDesignComponent extends AlertComponentTokens {
  componentType: 'design';
  /**
   * Component type (primary, secondary, tertiary, etc.)
   *
   * @default 'primary'
   */
  type: string;
}

export interface AlertLayoutComponent extends AlertComponentTokens {
  componentType: 'layout';
  /**
   * Component layout
   */
  layout: 'horizontal' | 'vertical';
}

export type AlertComponent = AlertDesignComponent | AlertLayoutComponent;

const isValidLayout = (layout: string): layout is AlertLayoutComponent['layout'] => {
  return ['horizontal', 'vertical'].includes(layout);
};

export default function extractAlertComponents(alertComponents: GetComponentSetComponentsResult): AlertComponents {
  return alertComponents.components
    .map((alertComponent): AlertComponent | null => {
      const type = normalizeNamePart(getComponentNamePart(alertComponent.name, 'Type') ?? 'default');
      const layout = normalizeNamePart(getComponentNamePart(alertComponent.name, 'Layout') ?? '');

      const instanceNode = layout ? alertComponent : findChildNodeWithType(alertComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for alert ${alertComponent.name}`);
      }

      const bodyNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Body');
      if (!bodyNode) {
        throw new Error(`No body node found for alert ${alertComponent.name}`);
      }

      const closeNode = findChildNodeWithTypeAndName(instanceNode, 'INSTANCE', 'Close');
      if (!closeNode) {
        throw new Error(`No close node found for alert ${alertComponent.name}`);
      }

      const closeIconColorNode = findChildNodeWithTypeAndName(closeNode, 'RECTANGLE', 'Color');
      if (!closeIconColorNode) {
        throw new Error(`No close icon color node found for alert ${alertComponent.name}`);
      }

      const iconNode = findChildNodeWithTypeAndName(bodyNode, 'INSTANCE', 'Icon');
      if (!iconNode) {
        throw new Error(`No icon node found for alert ${alertComponent.name}`);
      }

      const iconColorNode = findChildNodeWithTypeAndName(iconNode, 'RECTANGLE', 'Color');
      if (!iconColorNode) {
        throw new Error(`No icon color node found for alert ${alertComponent.name}`);
      }

      const contentNode = findChildNodeWithTypeAndName(bodyNode, 'FRAME', 'Content');
      if (!contentNode) {
        throw new Error(`No content node found for alert ${alertComponent.name}`);
      }

      const titleNode = findChildNodeWithTypeAndName(contentNode, 'TEXT', 'Title');
      if (!titleNode) {
        throw new Error(`No title node found for alert ${alertComponent.name}`);
      }

      const textNode = findChildNodeWithTypeAndName(contentNode, 'TEXT', 'Text');
      if (!textNode) {
        throw new Error(`No text node found for alert ${alertComponent.name}`);
      }

      const actionsNode = findChildNodeWithTypeAndName(bodyNode, 'FRAME', 'Actions');
      if (!actionsNode) {
        throw new Error(`No actions node found for alert ${alertComponent.name}`);
      }

      const actionsLinkNode = findChildNodeWithTypeAndName(actionsNode, 'TEXT', 'Link');
      if (!actionsLinkNode) {
        throw new Error(`No actions link node found for alert ${alertComponent.name}`);
      }

      const tokens: Omit<AlertComponentTokens, 'id'> = {
        // Description
        description: alertComponents.metadata[alertComponent.id]?.description ?? '',
        // Background color
        background: instanceNode.background.slice(),

        // Padding
        paddingTop: instanceNode.paddingTop ?? 0,
        paddingRight: instanceNode.paddingRight ?? 0,
        paddingBottom: instanceNode.paddingBottom ?? 0,
        paddingLeft: instanceNode.paddingLeft ?? 0,

        // Border
        borderWeight: instanceNode.strokeWeight ?? 0,
        borderRadius: instanceNode.cornerRadius ?? 0,
        borderColor: instanceNode.strokes.slice(),

        // Shadow
        effects: [...instanceNode.effects],

        spacing: instanceNode.itemSpacing ?? 0,

        parts: {
          close: {
            color: closeIconColorNode.fills.slice(),
          },
          icon: {
            color: iconColorNode.fills.slice(),
          },
          body: {
            spacing: bodyNode.itemSpacing ?? 0,
          },
          content: {
            spacing: contentNode.itemSpacing ?? 0,
          },
          title: {
            fontFamily: titleNode.style.fontFamily,
            fontSize: titleNode.style.fontSize,
            fontWeight: titleNode.style.fontWeight,
            lineHeight: (titleNode.style.lineHeightPercentFontSize ?? 100) / 100,
            letterSpacing: titleNode.style.letterSpacing,
            textAlign: titleNode.style.textAlignHorizontal,
            textDecoration: titleNode.style.textDecoration ?? 'NONE',
            textCase: titleNode.style.textCase ?? 'ORIGINAL',
            color: titleNode.fills.slice(),
            characters: titleNode.characters,
          },
          text: {
            fontFamily: textNode.style.fontFamily,
            fontSize: textNode.style.fontSize,
            fontWeight: textNode.style.fontWeight,
            lineHeight: (textNode.style.lineHeightPercentFontSize ?? 100) / 100,
            letterSpacing: textNode.style.letterSpacing,
            textAlign: textNode.style.textAlignHorizontal,
            textDecoration: textNode.style.textDecoration ?? 'NONE',
            textCase: textNode.style.textCase ?? 'ORIGINAL',
            color: textNode.fills.slice(),
            characters: textNode.characters,
          },
          actions: {
            spacing: actionsNode.itemSpacing ?? 0,
            fontFamily: actionsLinkNode.style.fontFamily,
            fontSize: actionsLinkNode.style.fontSize,
            fontWeight: actionsLinkNode.style.fontWeight,
            lineHeight: (actionsLinkNode.style.lineHeightPercentFontSize ?? 100) / 100,
            letterSpacing: actionsLinkNode.style.letterSpacing,
            textAlign: actionsLinkNode.style.textAlignHorizontal,
            textDecoration: actionsLinkNode.style.textDecoration ?? 'NONE',
            textCase: actionsLinkNode.style.textCase ?? 'ORIGINAL',
            color: actionsLinkNode.fills.slice(),
            characters: actionsLinkNode.characters,
          },
        },
      };

      if (layout) {
        if (!isValidLayout(layout)) {
          return null;
        }

        return {
          id: `layout-${layout}`,
          componentType: 'layout',
          layout,
          ...tokens,
        };
      }

      return {
        id: `design-type-${type}`,
        componentType: 'design',
        type,
        ...tokens,
      };
    })
    .filter(filterOutNull);
}
