import { DocumentationObject } from '../../types';
import Handoff from '../../index';
/**
 * Create a snippet transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export declare function snippetTransformer(handoff: Handoff): Promise<void>;
export declare function renameSnippet(handoff: Handoff, source: string, destination: string): Promise<void>;
export declare function processSnippet(handoff: Handoff, file: string): Promise<void>;
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<{
    components: {
        [key: string]: {
            id: string;
            preview: string;
            code: string;
            js?: string;
            css?: string;
            sass?: string;
        }[];
    };
}>;
