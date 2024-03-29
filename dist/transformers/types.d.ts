export declare type FoundationType = 'colors' | 'typography' | 'effects';
export declare type TokenType = 'css' | 'scss' | 'sd' | 'map';
export declare type TokenDict = {
    [property: string]: string | [value: string, isSupportedCssProperty: boolean];
};
export interface TransformerOutput {
    components: Record<string, string>;
    design: Record<FoundationType, string>;
    attachments?: Record<string, string>;
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
