import Handoff from '../../index';
import { DocumentationObject } from '../../types';
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<{
    components: {
        [key: string]: {
            id: string;
            type?: import("./types").ComponentType;
            image?: string;
            group?: string;
            categories?: string[];
            tags?: string[];
            should_do?: string[];
            should_not_do?: string[];
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
                [key: string]: import("./types").OptionalPreviewRender;
            };
            properties?: {
                [key: string]: import("./component").SlotMetadata;
            };
        }[];
    };
}>;
