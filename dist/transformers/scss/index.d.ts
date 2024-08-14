import { DocumentationObject } from '../../types';
import { TransformerOutput } from '../types';
import { IntegrationObject } from 'handoff/types/config';
/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export declare function scssTypesTransformer(documentationObject: DocumentationObject, integrationObject: IntegrationObject): TransformerOutput;
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject: DocumentationObject, integrationObject: IntegrationObject): TransformerOutput;
