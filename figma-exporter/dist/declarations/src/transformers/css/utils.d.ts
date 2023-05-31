import * as FigmaTypes from '../../figma/types';
/**
 * Get the name of a SCSS variable from a token object
 * @param tokens
 * @returns string
 */
export declare const getScssVariableName: <Tokens extends {
    component: string;
    property: string;
    part?: string | undefined;
    theme?: string | undefined;
    type?: string | undefined;
    state?: string | undefined;
}>(tokens: Tokens) => string;
/**
 * Get the name of a CSS variable from a token object
 * @param tokens
 * @returns
 */
export declare const getCssVariableName: <Tokens extends {
    component: string;
    property: string;
    part?: string | undefined;
    theme?: string | undefined;
    type?: string | undefined;
    state?: string | undefined;
}>(tokens: Tokens) => string;
/**
 * Transform a Figma color to a CSS color
 * @param color
 * @returns string
 */
export declare const transformFigmaColorToCssColor: (color: FigmaTypes.Color) => string;
/**
 * Transform a Figma fill color to a CSS color
 * @param paint
 * @returns
 */
export declare const transformFigmaFillsToCssColor: (paint: FigmaTypes.Paint) => string;
/**
 *
 * @param textAlign
 * @returns
 */
export declare const transformFigmaTextAlignToCss: (textAlign: FigmaTypes.TypeStyle['textAlignHorizontal']) => string;
export declare const transformFigmaTextDecorationToCss: (textDecoration: FigmaTypes.TypeStyle['textDecoration']) => string;
export declare const transformFigmaTextCaseToCssTextTransform: (textCase: FigmaTypes.TypeStyle['textCase']) => string;
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
export declare const getTypesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getStatesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getThemesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getSizesFromComponents: (components: AbstractComponent[]) => string[];
