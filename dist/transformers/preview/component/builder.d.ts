import { FileComponentsObject } from '../../../exporters/components/types';
import Handoff from '../../../index';
import { ComponentListObject } from '../types';
/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export declare function processComponents(handoff: Handoff, id?: string, sharedStyles?: string, components?: FileComponentsObject, segmentToUpdate?: 'js' | 'css' | 'previews' | 'validation'): Promise<ComponentListObject[]>;
export default processComponents;
