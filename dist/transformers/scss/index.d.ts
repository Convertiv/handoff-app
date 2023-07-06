import { DocumentationObject } from '../../types';
import { ExportableTransformerOptionsMap, TransformerOutput } from '../types';
/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export declare function scssTypesTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput;
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput;
