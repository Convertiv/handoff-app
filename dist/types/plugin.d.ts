import { Exportable } from "../types";
export declare type IVariantPropValueReplacement = [variantProperty: string, find: string, replace: string];
export interface IComponentSetMetadata {
    exposed: boolean;
    name: string;
    parts: IComponentPart[];
    tokenNameSegments: string[];
    replacements: IVariantPropValueReplacement[];
    sharedVariants: ISharedComponentVariant[];
}
export interface IComponentPart {
    name: string;
    definitions: IExportDefinition[];
}
export interface IExportDefinition {
    from: string;
    export: Exportable[];
}
export interface ISharedComponentVariant {
    componentId: string;
    sharedVariantProperty?: string;
    distinctiveVariantProperties?: string[];
}
