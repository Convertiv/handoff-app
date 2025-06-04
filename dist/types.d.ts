import { Types as CoreTypes } from 'handoff-core';
import { SlotMetadata } from './transformers/preview/component';
export interface ValidationResult {
    /**
     * Description of what this validation check does
     */
    description: string;
    /**
     * Whether the validation passed or failed
     */
    passed: boolean;
    /**
     * Optional messages providing more details about the validation result
     */
    messages?: string[];
    /**
     * Optional severity level of the validation result
     */
    severity?: 'error' | 'warning' | 'info';
    /**
     * Optional timestamp of when the validation was performed
     */
    timestamp?: string;
}
export interface ValidationResults {
    [key: string]: ValidationResult;
}
export interface ReferenceObject {
    reference: string;
    type: string;
    name: string;
    group: string;
}
export interface PreviewObject {
    id: string;
    title: string;
    image: string;
    description: string;
    figma: string;
    should_do: string[];
    should_not_do: string[];
    categories?: string[];
    tags?: string[];
    preview: string;
    previews: {
        [key: string]: {
            title: string;
            values: {
                [key: string]: string;
            };
            url: string;
        };
    };
    properties?: {
        [key: string]: SlotMetadata;
    };
    code: string;
    html?: string;
    format: string;
    variant?: Record<string, string>;
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
}
export declare type PreviewJson = {
    components: {
        [key in keyof CoreTypes.IDocumentationObject['components']]: PreviewObject[];
    };
};
export interface ComponentDocumentationOptions {
    views?: {
        [view: string]: {
            condition?: {
                [property: string]: ComponentViewFilterValue;
            };
            sort?: string[];
            title?: string;
        };
    };
}
declare type ComponentViewFilterValue = string | string[] | {
    [value: string]: {
        [prop: string]: string;
    };
};
export {};
