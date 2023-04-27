import { DocumentationObject } from '../../types';
/**
 * The output of the CSS transformer
 */
export interface CssTransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<'colors' | 'typography' | 'effects', string>;
}
/**
 * Creates a CSS transformer output from a documentation object
 * @param documentationObject
 * @returns The CSS transformer output
 */
export default function cssTransformer(documentationObject: DocumentationObject): CssTransformerOutput;
