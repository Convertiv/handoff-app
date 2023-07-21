import { DocumentationObject } from '../../types';
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(documentationObject: DocumentationObject): Promise<{
    components: {
        [key: string]: {
            id: string;
            preview: string;
            code: string;
        }[];
    };
}>;
