export declare type TransformComponentTokensResult = {
    id: string;
    preview: string;
    code: string;
} | null;
export interface TransformedPreviewComponents {
    [key: string]: TransformComponentTokensResult[];
}
