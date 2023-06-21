import { ColorObject, EffectObject, TypographyObject } from '../types';
declare const getFileDesignTokens: (fileId: string, accessToken: string) => Promise<{
    color: ColorObject[];
    typography: TypographyObject[];
    effect: EffectObject[];
}>;
export default getFileDesignTokens;
