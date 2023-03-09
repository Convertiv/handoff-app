import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, normalizeNamePart } from '../utils';

export type ModalComponents = ModalComponent[];

interface ModalPartProperties {
  background: FigmaTypes.Paint[],
  paddingTop: number,
  paddingRight: number,
  paddingBottom: number,
  paddingLeft: number,
  borderWeight: number,
  borderRadius: number,
  borderColor: FigmaTypes.Paint[];
  effects: FigmaTypes.Effect[];
}

interface ModalPartTextProperties {
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  lineHeight: number,
  letterSpacing: number,
  textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'],
  textDecoration: FigmaTypes.TypeStyle['textDecoration'],
  textTransform: FigmaTypes.TypeStyle['textCase'],
  color: FigmaTypes.Paint[],
  characters: string,
}

type ModalHeaderPartProperties = ModalPartProperties & { title: ModalPartTextProperties };
type ModalBodyPartProperties = ModalPartProperties & { content: ModalPartTextProperties };
type ModalFooterPartProperties = ModalPartProperties & { copy: ModalPartTextProperties };

export interface ModalComponentTokens extends ModalPartProperties{
  id: string;
  description: string;
  parts: {
    header: ModalHeaderPartProperties,
    body: ModalBodyPartProperties,
    footer: ModalFooterPartProperties,
  }
}

export interface ModalDesignComponent extends ModalComponentTokens {
  componentType: 'design';
  type: string;
}

export interface ModalLayoutComponent extends ModalComponentTokens {
  componentType: 'layout';
  size: string;
}


export type ModalComponent = ModalDesignComponent | ModalLayoutComponent;

export default function extractModalComponents(modalComponents: GetComponentSetComponentsResult): ModalComponents {
  return modalComponents.components
    .map((modalComponent): ModalComponent => {
      const type = normalizeNamePart(getComponentNamePart(modalComponent.name, 'Type') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(modalComponent.name, 'Size') ?? '');

      const instanceNode = size ? modalComponent : findChildNodeWithType(modalComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for select component ${modalComponent.name}`);
      }

      // Header
      const headerNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'header');
      if (!headerNode) {
        throw new Error(`No header node found for modal component ${modalComponent.name}`);
      }

      // Header title
      const headerTitleNode = findChildNodeWithType(headerNode, 'TEXT');
      if (!headerTitleNode) {
        throw new Error(`No header title node found for modal header component ${headerNode.name}`);
      }

      // Body
      const bodyNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'body');
      if (!bodyNode) {
        throw new Error(`No body node found for modal component ${modalComponent.name}`);
      }

      // Body content
      const bodyContentNode = findChildNodeWithType(bodyNode, 'TEXT');
      if (!bodyContentNode) {
        throw new Error(`No body content node found for modal body component ${bodyNode.name}`);
      }

      // Footer
      const footerNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'footer');
      if (!footerNode) {
        throw new Error(`No footer node found for modal component ${modalComponent.name}`);
      }

      // Footer copy
      const footerCopyNode = findChildNodeWithType(footerNode, 'TEXT');
      if (!footerCopyNode) {
        throw new Error(`No footer copy node found for modal footer component ${footerNode.name}`);
      }

      const tokens = {
        // Description
        description: modalComponents.metadata[modalComponent.id]?.description ?? '',
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
        parts: {
          header: {
            // Background color
            background: headerNode.background.slice(),
            // Padding
            paddingTop: headerNode.paddingTop ?? 0,
            paddingRight: headerNode.paddingRight ?? 0,
            paddingBottom: headerNode.paddingBottom ?? 0,
            paddingLeft: headerNode.paddingLeft ?? 0,
            // Border
            borderWeight: headerNode.strokeWeight ?? 0,
            borderRadius: headerNode.cornerRadius ?? 0,
            borderColor: headerNode.strokes.slice(),
            // Shadow
            effects: [...headerNode.effects],
            // Title
            title: {
              fontFamily: headerTitleNode.style.fontFamily,
              fontSize: headerTitleNode.style.fontSize,
              fontWeight: headerTitleNode.style.fontWeight,
              lineHeight: (headerTitleNode.style.lineHeightPercentFontSize ?? 100) / 100,
              letterSpacing: headerTitleNode.style.letterSpacing,
              textAlign: headerTitleNode.style.textAlignHorizontal,
              textDecoration: headerTitleNode.style.textDecoration ?? 'NONE',
              textTransform: headerTitleNode.style.textCase ?? 'ORIGINAL',
              color: headerTitleNode.fills.slice(),
              characters: headerTitleNode.characters,
            }
          },
          body: {
            // Background color
            background: bodyNode.background.slice(),
            // Padding
            paddingTop: bodyNode.paddingTop ?? 0,
            paddingRight: bodyNode.paddingRight ?? 0,
            paddingBottom: bodyNode.paddingBottom ?? 0,
            paddingLeft: bodyNode.paddingLeft ?? 0,
            // Border
            borderWeight: bodyNode.strokeWeight ?? 0,
            borderRadius: bodyNode.cornerRadius ?? 0,
            borderColor: bodyNode.strokes.slice(),
            // Shadow
            effects: [...bodyNode.effects],
            // Content
            content: {
              fontFamily: bodyContentNode.style.fontFamily,
              fontSize: bodyContentNode.style.fontSize,
              fontWeight: bodyContentNode.style.fontWeight,
              lineHeight: (bodyContentNode.style.lineHeightPercentFontSize ?? 100) / 100,
              letterSpacing: bodyContentNode.style.letterSpacing,
              textAlign: bodyContentNode.style.textAlignHorizontal,
              textDecoration: bodyContentNode.style.textDecoration ?? 'NONE',
              textTransform: bodyContentNode.style.textCase ?? 'ORIGINAL',
              color: bodyContentNode.fills.slice(),
              characters: bodyContentNode.characters,
            }
          },
          footer: {
            // Background color
            background: footerNode.background.slice(),
            // Padding
            paddingTop: footerNode.paddingTop ?? 0,
            paddingRight: footerNode.paddingRight ?? 0,
            paddingBottom: footerNode.paddingBottom ?? 0,
            paddingLeft: footerNode.paddingLeft ?? 0,
            // Border
            borderWeight: footerNode.strokeWeight ?? 0,
            borderRadius: footerNode.cornerRadius ?? 0,
            borderColor: footerNode.strokes.slice(),
            // Shadow
            effects: [...footerNode.effects],
            // Content
            copy: {
              fontFamily: footerCopyNode.style.fontFamily,
              fontSize: footerCopyNode.style.fontSize,
              fontWeight: footerCopyNode.style.fontWeight,
              lineHeight: (footerCopyNode.style.lineHeightPercentFontSize ?? 100) / 100,
              letterSpacing: footerCopyNode.style.letterSpacing,
              textAlign: footerCopyNode.style.textAlignHorizontal,
              textDecoration: footerCopyNode.style.textDecoration ?? 'NONE',
              textTransform: footerCopyNode.style.textCase ?? 'ORIGINAL',
              color: footerCopyNode.fills.slice(),
              characters: footerCopyNode.characters,
            }
          }
        }
      }

      if (size) {
        return {
          id: `layout-size-${size}`,
          componentType: 'layout',
          size,
          ...tokens
        }
      }

      return {
        id: `design-type-${type}`,
        componentType: 'design',
        type,
        ...tokens
      };
    }
  ).filter(filterOutNull);;
}
