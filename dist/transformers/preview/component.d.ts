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
    OBJECT = "object",
    FUNCTION = "function",
    ENUM = "enum",
    ANY = "any"
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
export type RuleObject = {
    required?: boolean;
    content?: {
        min: number;
        max: number;
    };
    dimensions?: {
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
export declare const getComponentOutputPath: (handoff: Handoff) => string;
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export declare function componentTransformer(handoff: Handoff): Promise<void>;
/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export declare function processSharedStyles(handoff: Handoff): Promise<string | null>;
