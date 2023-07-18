import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from "../types";
export declare type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;
export declare type FoundationType = 'colors' | 'typography' | 'effects';
export declare type TokenType = 'css' | 'scss' | 'sd';
export declare type TokenDict = {
    [property: string]: string | [value: string, isSupportedCssProperty: boolean];
};
export interface AbstractComponent {
    componentType?: string;
    theme?: string;
    type?: string;
    state?: string;
    size?: string;
    layout?: string;
}
export interface TransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<FoundationType, string>;
}
export interface Token {
    property: string;
    value: string;
    part: string;
    metadata: {
        name: string;
        type: string;
        state: string;
        theme: string;
        layout: string;
        size: string;
        part: string;
        variant: string;
        activity: string;
        propertyPath: string[];
        isSupportedCssProperty: boolean;
    };
}
