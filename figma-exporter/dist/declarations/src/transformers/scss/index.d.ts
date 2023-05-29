import { DocumentationObject } from '../../types';
import { ExportableTransformerOptionsMap } from '../types';
interface ScssTypesTransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<'colors' | 'typography' | 'effects', string>;
}
interface ScssTransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<'colors' | 'typography' | 'effects', string>;
}
/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export declare function scssTypesTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): ScssTypesTransformerOutput;
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): ScssTransformerOutput;
export {};
