import Handoff from '../../../index';
import { ComponentListObject } from '../types';
/**
 * Types of component segments that can be updated
 */
export declare enum ComponentSegment {
    JavaScript = "javascript",
    Style = "style",
    Previews = "previews",
    Validation = "validation",
    ValidationOnly = "validation-only"
}
/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToProcess - Optional segment to update
 * @returns Promise resolving to an array of processed components
 */
export declare function processComponents(handoff: Handoff, id?: string, segmentToProcess?: ComponentSegment): Promise<ComponentListObject[]>;
export default processComponents;
