import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from "../types";
export declare type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;
export declare type FoundationType = 'colors' | 'typography' | 'effects';
export declare type TokenType = 'css' | 'scss' | 'sd';
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
export interface ValueProperty {
    property: string;
    value: string;
    part: string;
    metadata: {
        propertyPath: string[];
        isSupportedCssProperty: boolean;
    };
}
