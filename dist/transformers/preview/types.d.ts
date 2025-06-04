import { ValidationResult } from '../../types';
import { SlotMetadata } from './component';
export declare enum ComponentType {
    Element = "element",
    Block = "block",
    Navigation = "navigation",
    Utility = "utility"
}
export declare type ComponentListObject = {
    id?: string;
    version: string;
    image: string;
    title: string;
    type: string;
    group: string;
    categories: string[];
    tags: string[];
    description: string;
    figma: string;
    properties: {
        [key: string]: SlotMetadata;
    };
    versions: string[];
    previews: {
        [key: string]: OptionalPreviewRender;
    };
    paths: string[];
    entries?: {
        js?: string;
        scss?: string;
        templates?: string;
    };
    options?: {
        preview?: {
            groupBy?: string;
        };
        transformer: {
            cssRootClass?: string;
            tokenNameSegments?: string[];
            defaults: {
                [variantProperty: string]: string;
            };
            replace: {
                [variantProperty: string]: {
                    [source: string]: string;
                };
            };
        };
    };
};
export declare type TransformComponentTokensResult = {
    id: string;
    source?: 'figma' | 'custom';
    type?: ComponentType;
    image?: string;
    group?: string;
    categories?: string[];
    figma?: string;
    tags?: string[];
    should_do?: string[];
    should_not_do?: string[];
    format: string;
    code: string;
    html?: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: {
        [key: string]: OptionalPreviewRender;
    };
    properties?: {
        [key: string]: SlotMetadata;
    };
    variant?: Record<string, string>;
    entries?: {
        js?: string;
        scss?: string;
        template?: string;
    };
    options?: {
        preview?: {
            groupBy?: string;
        };
    };
    /**
     * Validation results for the component
     * Each key represents a validation type and the value contains detailed validation results
     */
    validations?: Record<string, ValidationResult>;
} | null;
export declare type OptionalPreviewRender = {
    title: string;
    values: {
        [key: string]: string | string[] | any;
    };
    url: string;
};
export interface TransformedPreviewComponents {
    [key: string]: TransformComponentTokensResult[];
}
