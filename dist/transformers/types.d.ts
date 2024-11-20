import { ReferenceObject } from "handoff/types";
export declare type FoundationType = 'colors' | 'typography' | 'effects';
export declare type TokenType = 'css' | 'scss' | 'sd' | 'map' | 'default';
export declare type TokenDict = {
    [property: string]: string | [value: string, isSupportedCssProperty: boolean] | undefined;
};
export declare type BackgroundTokenDict = {
    [K in 'background']: TokenDict[K];
};
export declare type SpacingTokenDict = {
    [K in 'padding-y' | 'padding-x' | 'padding-top' | 'padding-right' | 'padding-bottom' | 'padding-left' | 'padding-start' | 'padding-end' | 'spacing']: TokenDict[K];
};
export declare type BorderTokenDict = {
    [K in 'border-width' | 'border-radius' | 'border-color' | 'border-style']: TokenDict[K];
};
export declare type TypographyTokenDict = {
    [K in 'font-family' | 'font-size' | 'font-weight' | 'line-height' | 'letter-spacing' | 'text-align' | 'text-decoration' | 'text-transform']: TokenDict[K];
};
export declare type FillTokenDict = {
    [K in 'color']: TokenDict[K];
};
export declare type EffectTokenDict = {
    [K in 'box-shadow']: TokenDict[K];
};
export declare type OpacityTokenDict = {
    [K in 'opacity']: TokenDict[K];
};
export declare type SizeTokenDict = {
    [K in 'width' | 'width-raw' | 'height' | 'height-raw']: SizeTokenDict[K];
};
export declare type KeyToTokenSetMap = {
    [K in keyof BackgroundTokenDict]: 'BACKGROUND';
} & {
    [K in keyof SpacingTokenDict]: 'SPACING';
} & {
    [K in keyof BorderTokenDict]: 'BORDER';
} & {
    [K in keyof TypographyTokenDict]: 'TYPOGRAPHY';
} & {
    [K in keyof FillTokenDict]: 'FILL';
} & {
    [K in keyof EffectTokenDict]: 'EFFECT';
} & {
    [K in keyof OpacityTokenDict]: 'OPACITY';
} & {
    [K in keyof SizeTokenDict]: 'SIZE';
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
        reference?: ReferenceObject;
        isSupportedCssProperty: boolean;
        nameSegments: string[];
    };
}
