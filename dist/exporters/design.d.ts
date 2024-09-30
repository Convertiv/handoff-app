import { ColorObject, EffectObject, TypographyObject } from '../types';
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
