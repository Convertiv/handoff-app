import * as FigmaTypes from '../figma/types';
import { GradientObject } from '../types';
/**
 * Generate a CSS gradient from a color gradient object

 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
export declare function transformGradientToCss(color: GradientObject, paintType?: FigmaTypes.PaintType): string;
export declare function transformFigmaPaintToGradient(paint: FigmaTypes.Paint): GradientObject | null;
/**
 * Converts figma color to a hex (string) value.
 *
 * @param {FigmaTypes.Color} color
 * @returns {string}
 *
 * @example
 * // returns #001aff
 * figmaRGBToHex({ r: 0, g: 0.1, b: 1, a: 1 })
 */
export declare function transformFigmaColorToHex(color: FigmaTypes.Color): string;
export declare const transformFigmaColorToCssColor: (color: FigmaTypes.Color) => string;
export declare function transformFigmaPaintToCssColor(paint: FigmaTypes.Paint, asLinearGradient?: boolean): string | null;
export declare const transformFigmaFillsToCssColor: (fills: ReadonlyArray<FigmaTypes.Paint>, forceHexOrRgbaValue?: boolean) => {
    color: string;
    blend: string;
};
export declare const transformFigmaTextAlignToCss: (textAlign: FigmaTypes.TypeStyle['textAlignHorizontal']) => string;
export declare const transformFigmaTextDecorationToCss: (textDecoration: FigmaTypes.TypeStyle['textDecoration']) => string;
export declare const transformFigmaTextCaseToCssTextTransform: (textCase: FigmaTypes.TypeStyle['textCase']) => string;
export declare const transformFigmaEffectToCssBoxShadow: (effect: FigmaTypes.Effect) => string;
/**
 * Converts figma color to a RGB(A) in form of a array.
 *
 * @param {FigmaTypes.Color} color
 * @returns {string}
 *
 * @example
 * // returns [226, 18, 17]
 * figmaRGBToWebRGB({r: 0.887499988079071, g: 0.07058823853731155, b: 0.0665624737739563, a: 1})
 */
export declare function figmaColorToWebRGB(color: FigmaTypes.Color): webRGB | webRGBA;
declare type webRGB = [number, number, number];
declare type webRGBA = [number, number, number, number];
export {};
