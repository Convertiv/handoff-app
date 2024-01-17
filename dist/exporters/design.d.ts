import { ColorObject, EffectObject, TypographyObject } from '../types';
export declare const getFigmaFileDesignTokens: (fileId: string, accessToken: string) => Promise<{
    color: ColorObject[];
    typography: TypographyObject[];
    effect: EffectObject[];
}>;
