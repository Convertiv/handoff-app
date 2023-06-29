import { DocumentationObject } from '../../types';
import { ExportableTransformerOptionsMap } from '../types';
/**
 * The output of the CSS transformer
 */
export interface CssTransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<'colors' | 'typography' | 'effects', string>;
}
export default function cssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): CssTransformerOutput;
