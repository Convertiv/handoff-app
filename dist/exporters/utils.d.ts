import * as FigmaTypes from '../figma/types';
export declare function filterByNodeType<Type extends FigmaTypes.Node['type']>(type: Type): (obj?: FigmaTypes.Node | null) => obj is any;
export declare function isNodeType<Type extends FigmaTypes.Node['type']>(obj: FigmaTypes.Node | null | undefined, type: Type): obj is Extract<FigmaTypes.Node, {
    type: Type;
}>;
export declare function findChildNodeWithType<Type extends FigmaTypes.Node['type']>(node: FigmaTypes.Node, type: Type): Extract<FigmaTypes.Node, {
    type: Type;
}> | null;
export declare function findChildNodeWithTypeAndName<Type extends FigmaTypes.Node['type']>(node: FigmaTypes.Node, type: Type, name: string): Extract<FigmaTypes.Node, {
    type: Type;
}> | null;
export declare function getComponentInstanceNamePart(componentInstanceName: string, partKey: string): string;
export declare function extractComponentInstanceVariantProps(componentInstanceName: string, supportedVariantProps: string[]): Map<string, string>;
export declare const isExportable: (exportable: string) => exportable is Exportable;
export declare const isValidNodeType: (type: string) => type is FigmaTypes.Node;
export declare const isValidEffectType: (effect: FigmaTypes.Effect) => boolean;
export declare const isShadowEffectType: (effect: FigmaTypes.Effect) => boolean;
export declare const isValidGradientType: (gradientType: FigmaTypes.PaintType) => boolean;
export declare const normalizeNamePart: (namePart: string) => string;
