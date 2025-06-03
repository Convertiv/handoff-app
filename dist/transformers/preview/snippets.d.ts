import Handoff from '../../index';
import { ComponentType } from './types';
export interface SnippetMetadata {
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
    type: SlotType;
    key?: string;
    rules?: string;
}
/**
 * In dev mode we want to watch the snippets folder for changes
 * @param handoff
 * @returns
 * @returns
 */
export declare const createFrameSocket: (handoff: Handoff) => Promise<(message: string) => void>;
/**
 * Create a snippet transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export declare function snippetTransformer(handoff: Handoff): Promise<void>;
/**
 * A utility function to rename a snippet
 * @param handoff
 * @param source
 * @param destination
 */
export declare function renameSnippet(handoff: Handoff, source: string, destination: string): Promise<void>;
/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export declare function processSharedStyles(handoff: Handoff): Promise<string | null>;
/**
 * Process process a specific snippet
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export declare function processSnippet(handoff: Handoff, file: string, sharedStyles: string | null, sub?: string): Promise<{
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
    previews?: import("./types").OptionalPreviewRender[];
    properties?: {
        [key: string]: SlotMetadata;
    };
}>;
export {};
