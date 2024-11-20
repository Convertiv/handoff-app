import { ColorObject, EffectObject, TypographyObject } from '../types';
/**
 * Create a machine name from a string
 * @param name
 * @returns string
 */
export declare const toMachineName: (name: string) => string;
/**
 * Create a machine name from a string
 * @param name
 * @returns string
 */
export declare const toSDMachineName: (name: string) => string;
/**
 * Fetches design tokens from a Figma file
 * @param fileId
 * @param accessToken
 * @returns Promise <{ color: ColorObject[]; typography: TypographyObject[]; effect: EffectObject[]; }>
 */
export declare const getFigmaFileDesignTokens: (fileId: string, accessToken: string) => Promise<{
    color: ColorObject[];
    typography: TypographyObject[];
    effect: EffectObject[];
}>;
