import { DocumentationObject } from '../../types';
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
export declare function scssTypesTransformer(documentationObject: DocumentationObject): ScssTypesTransformerOutput;
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject: DocumentationObject): ScssTransformerOutput;
export {};
