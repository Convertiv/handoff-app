import { DocumentationObject } from '../../types';
import Handoff from '../../index';
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
        }[];
    };
}>;
