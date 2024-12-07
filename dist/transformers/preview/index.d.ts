import Handoff from '../../index';
import { DocumentationObject } from '../../types';
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<{
    components: {
        [key: string]: {
            id: string;
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
                [key: string]: import("./snippets").SlotMetadata;
            };
        }[];
    };
}>;
