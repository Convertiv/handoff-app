import Handoff from '../../index';
export interface SnippetMetadata {
    title: string;
    description: string;
    slots: {
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
}
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
export declare function processSnippet(handoff: Handoff, file: string, sharedStyles: string | null): Promise<void>;
export {};
