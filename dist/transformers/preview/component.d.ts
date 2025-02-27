import { FileComponentsObject } from '../../exporters/components/types';
import Handoff from '../../index';
export interface ComponentMetadata {
    title: string;
    type?: string;
    group?: string;
    description: string;
    properties: {
        [key: string]: SlotMetadata;
    };
}
export declare enum SlotType {
    TEXT = "text",
    IMAGE = "image",
    BUTTON = "button",
    ARRAY = "array",
    NUMBER = "number",
    BOOLEAN = "boolean",
    OBJECT = "object"
}
export interface SlotMetadata {
    id?: string;
    name: string;
    description: string;
    generic: string;
    default?: string;
    type: SlotType;
    items?: {
        type: SlotType;
        properties?: {
            [key: string]: SlotMetadata;
        };
    };
    properties?: {
        [key: string]: SlotMetadata;
    };
    key?: string;
    rules?: RuleObject;
}
export declare type RuleObject = {
    required?: boolean;
    content?: {
        min: number;
        max: number;
    };
    dimension?: {
        width: number;
        height: number;
        min: {
            width: number;
            height: number;
        };
        max: {
            width: number;
            height: number;
        };
        recommend: {
            width: number;
            height: number;
        };
    };
    filesize?: number;
    filetype?: string;
    pattern?: string;
};
/**
 * In dev mode we want to watch the components folder for changes
 * @param handoff
 * @returns
 * @returns
 */
export declare const createFrameSocket: (handoff: Handoff) => Promise<void>;
export declare const getComponentPath: (handoff: Handoff) => string;
export declare const getComponentOutputPath: (handoff: Handoff) => string;
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export declare function componentTransformer(handoff: Handoff, components?: FileComponentsObject): Promise<void>;
/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export declare function processSharedStyles(handoff: Handoff): Promise<string | null>;
