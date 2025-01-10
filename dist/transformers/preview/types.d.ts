import { SlotMetadata } from './component';
export declare enum ComponentType {
    Element = "element",
    Block = "block",
    Navigation = "navigation",
    Utility = "utility"
}
export declare type ComponentListObject = {
    id: string;
    version: string;
    title: string;
    type: string;
    group: string;
    tags: string[];
    description: string;
    properties: {
        [key: string]: SlotMetadata;
    };
};
export declare type TransformComponentTokensResult = {
    id: string;
    type?: ComponentType;
    group?: string;
    tags?: string[];
    code: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: OptionalPreviewRender[];
    properties?: {
        [key: string]: SlotMetadata;
    };
} | null;
export declare type OptionalPreviewRender = {
    title: string;
    values: {
        [key: string]: string | string[];
    };
    url: string;
};
export interface TransformedPreviewComponents {
    [key: string]: TransformComponentTokensResult[];
}
