import * as FigmaTypes from '../figma/types';
import { Exportable, VariantPropertyWithParams } from '../types';
export declare function filterByNodeType<Type extends FigmaTypes.Node['type']>(type: Type): (obj?: FigmaTypes.Node | null) => obj is Extract<FigmaTypes.Document, {
    type: Type;
}> | Extract<FigmaTypes.Canvas, {
    type: Type;
}> | Extract<FigmaTypes.Frame, {
    type: Type;
}> | Extract<FigmaTypes.Group, {
    type: Type;
}> | Extract<FigmaTypes.Vector, {
    type: Type;
}> | Extract<FigmaTypes.BooleanOperation, {
    type: Type;
}> | Extract<FigmaTypes.Star, {
    type: Type;
}> | Extract<FigmaTypes.Line, {
    type: Type;
}> | Extract<FigmaTypes.Ellipse, {
    type: Type;
}> | Extract<FigmaTypes.RegularPolygon, {
    type: Type;
}> | Extract<FigmaTypes.Rectangle, {
    type: Type;
}> | Extract<FigmaTypes.Text, {
    type: Type;
}> | Extract<FigmaTypes.Slice, {
    type: Type;
}> | Extract<FigmaTypes.Component, {
    type: Type;
}> | Extract<FigmaTypes.ComponentSet, {
    type: Type;
}> | Extract<FigmaTypes.Instance, {
    type: Type;
}>;
export declare function isNodeType<Type extends FigmaTypes.Node['type']>(obj: FigmaTypes.Node | null | undefined, type: Type): obj is Extract<FigmaTypes.Node, {
    type: Type;
}>;
export declare function findChildNodeWithType<Type extends FigmaTypes.Node['type']>(node: FigmaTypes.Node, type: Type): Extract<FigmaTypes.Node, {
    type: Type;
}> | null;
export declare function findChildNodeWithTypeAndName<Type extends FigmaTypes.Node['type']>(node: FigmaTypes.Node, type: Type, name: string): Extract<FigmaTypes.Node, {
    type: Type;
}> | null;
export declare function getComponentNamePart(component: string, partKey: string): string;
export declare function extractComponentVariantProps(component: string, supportedVariantProps: VariantPropertyWithParams[], defaults: {
    [variantProperty: string]: string;
}): [Map<string, string>, boolean];
export declare const isExportable: (exportable: string) => exportable is Exportable;
export declare const isValidNodeType: (type: string) => type is "DOCUMENT" | "CANVAS" | "FRAME" | "GROUP" | "VECTOR" | "BOOLEAN_OPERATION" | "STAR" | "LINE" | "ELLIPSE" | "REGULAR_POLYGON" | "RECTANGLE" | "TEXT" | "SLICE" | "COMPONENT" | "COMPONENT_SET" | "INSTANCE";
export declare const isValidEffectType: (effect: FigmaTypes.Effect['type']) => boolean;
export declare const isShadowEffectType: (effect: FigmaTypes.Effect['type']) => boolean;
export declare const isValidGradientType: (gradientType: FigmaTypes.PaintType) => boolean;
export declare const normalizeNamePart: (namePart: string) => string;
