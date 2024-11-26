import { SlotMetadata } from './snippets';
export declare type TransformComponentTokensResult = {
    id: string;
    code: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: OptionalPreviewRender[];
    slots?: {
        [key: string]: SlotMetadata;
    };
} | null;
export declare type OptionalPreviewRender = {
    title: string;
    values: {
        [key: string]: string;
    };
    url: string;
};
export interface TransformedPreviewComponents {
    [key: string]: TransformComponentTokensResult[];
}
