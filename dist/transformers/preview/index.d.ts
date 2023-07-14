import { DocumentationObject } from '../../types';
import { TransformComponentTokensResult } from './types';
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(documentationObject: DocumentationObject): Promise<{
    components: {
        [key: string]: TransformComponentTokensResult[];
    };
}>;
