import { DocumentationObject } from '../../types';
declare type TransformComponentTokensResult = {
    id: string;
    preview: string;
    code: string;
} | null;
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(documentationObject: DocumentationObject): Promise<{
    components: {
        [key: string]: TransformComponentTokensResult[];
    };
}>;
export {};
