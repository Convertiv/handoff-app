import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from "../types";
export interface AbstractComponent {
    componentType?: string;
    /**
     * Component theme (light, dark)
     */
    theme?: string;
    /**
     * Component type (primary, secondary, tertiary, etc.)
     */
    type?: string;
    /**
     * Component state (default, hover, disabled)
     */
    state?: string;
    /**
     * Component size (lg, md, sm, xs, ...)
     */
    size?: string;
    layout?: string;
}
export interface TransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<'colors' | 'typography' | 'effects', string>;
}
export interface ValueProperty {
    value: string;
    property: string;
    part?: string;
}
export declare type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;
export declare type TokenType = 'css' | 'scss' | 'sd';
