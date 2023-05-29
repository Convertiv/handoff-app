import * as FigmaTypes from '../figma/types';
import { Exportable, VariantProperty } from '../types';

export function filterByNodeType<Type extends FigmaTypes.Node['type']>(type: Type) {
  return (obj?: FigmaTypes.Node | null): obj is Extract<FigmaTypes.Node, { type: Type }> => obj?.type === type;
}

export function isNodeType<Type extends FigmaTypes.Node['type']>(
  obj: FigmaTypes.Node | null | undefined,
  type: Type
): obj is Extract<FigmaTypes.Node, { type: Type }> {
  return obj?.type === type;
}

export function findChildNodeWithType<Type extends FigmaTypes.Node['type']>(
  node: FigmaTypes.Node,
  type: Type
): Extract<FigmaTypes.Node, { type: Type }> | null {
  if (isNodeType(node, type)) {
    return node;
  }

  if (!('children' in node) || !node.children.length) {
    return null;
  }

  if (node.children) {
    for (const child of node.children) {
      const foundNode = findChildNodeWithType(child, type);

      if (foundNode) {
        return foundNode;
      }
    }
  }

  return null;
}

export function findChildNodeWithTypeAndName<Type extends FigmaTypes.Node['type']>(
  node: FigmaTypes.Node,
  type: Type,
  name: string
): Extract<FigmaTypes.Node, { type: Type }> | null {
  if (isNodeType(node, type) && node.name.toLowerCase() === name.toLowerCase()) {
    return node;
  }

  if (!('children' in node) || !node.children.length) {
    return null;
  }

  if (node.children) {
    for (const child of node.children) {
      const foundNode = findChildNodeWithTypeAndName(child, type, name);

      if (foundNode) {
        return foundNode;
      }
    }
  }

  return null;
}

export function getComponentNamePart(componentName: string, partKey: string) {
  return componentName
    .split(',')
    .find((part) => part.trim().startsWith(`${partKey}=`))
    ?.split('=')[1];
}

export const isValidVariantProperty = (variantProperty: string): variantProperty is VariantProperty => {
  return ['THEME', 'TYPE', 'STATE', 'ACTIVITY', 'LAYOUT', 'SIZE'].includes(variantProperty);
}

export const isExportable = (exportable: string): exportable is Exportable => {
  return ['BACKGROUND', 'BORDER', 'SPACING', 'TYPOGRAPHY', 'FILL', 'EFFECT', 'OPACITY', 'SIZE'].includes(exportable);
}

export const isValidNodeType = (type: string): type is FigmaTypes.Node['type'] => {
  return ['DOCUMENT', 'CANVAS', 'FRAME', 'GROUP', 'VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE', 'REGULAR_POLYGON', 'RECTANGLE', 'TEXT', 'SLICE', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
}

export const isValidEffectType = (effect: FigmaTypes.Effect['type']): boolean => {
  return isShadowEffectType(effect);
}

export const isShadowEffectType = (effect: FigmaTypes.Effect['type']): boolean => {
  return ['DROP_SHADOW', 'INNER_SHADOW'].includes(effect);
}

export const isValidGradientType = (gradientType: FigmaTypes.PaintType): boolean => {
  return ['GRADIENT_LINEAR', 'GRADIENT_RADIAL'].includes(gradientType);
}

export const normalizeNamePart = (namePart: string) => {
  return namePart
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-/g, '')
    .replace(/-$/g, '')
    .toLowerCase();
};
