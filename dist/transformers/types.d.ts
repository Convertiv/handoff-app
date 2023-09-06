import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from "../types";
export declare type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;
export declare type FoundationType = 'colors' | 'typography' | 'effects';
export declare type TokenType = 'css' | 'scss' | 'sd';
export declare type TokenDict = {
    [property: string]: string | [value: string, isSupportedCssProperty: boolean];
};
export interface TransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<FoundationType, string>;
}
export interface Token {
    name: string;
    value: string;
    metadata: {
        part: string;
        cssProperty: string;
        isSupportedCssProperty: boolean;
        nameSegments: string[];
    };
}
