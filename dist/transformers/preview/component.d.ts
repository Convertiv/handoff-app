import Handoff from '../../index';
import { ComponentType } from './types';
export interface ComponentMetadata {
    title: string;
    description: string;
    properties: {
        [key: string]: SlotMetadata;
    };
}
declare enum SlotType {
    STRING = "string",
    IMAGE = "image"
}
export interface SlotMetadata {
    name: string;
    description: string;
    generic: string;
    default?: string;
    type: SlotType;
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
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export declare function componentTransformer(handoff: Handoff): Promise<void>;
/**
 * A utility function to rename a component
 * @param handoff
 * @param source
 * @param destination
 */
export declare function renameComponent(handoff: Handoff, source: string, destination: string): Promise<void>;
/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export declare function processSharedStyles(handoff: Handoff): Promise<string | null>;
/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export declare function processComponent(handoff: Handoff, file: string, sharedStyles: string | null, version?: string): Promise<{
    id: string;
    type?: ComponentType;
    group?: string;
    tags?: string[];
    code: string;
    html?: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: import("./types").OptionalPreviewRender[];
    properties?: {
        [key: string]: SlotMetadata;
    };
}>;
export {};
