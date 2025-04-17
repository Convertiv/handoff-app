import Handoff from '../../../index';
import { ComponentListObject } from '../types';
/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToUpdate - Optional segment to update ('js', 'css', 'previews', or 'validation')
 * @returns Promise resolving to an array of processed components
 */
export declare function processComponents(handoff: Handoff, id?: string, segmentToUpdate?: 'js' | 'css' | 'previews' | 'validation'): Promise<ComponentListObject[]>;
export default processComponents;
