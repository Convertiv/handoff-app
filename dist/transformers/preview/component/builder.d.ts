import Handoff from '../../../index';
import { ComponentListObject } from '../types';
/**
 * Types of component segments that can be updated
 */
export declare enum ComponentSegment {
    JavaScript = "javascript",
    Style = "style",
    Previews = "previews",
    Validation = "validation"
}
/**
 * Options for processing components
 */
export interface ProcessComponentsOptions {
    /** Enable caching to skip unchanged components */
    useCache?: boolean;
}
/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToProcess - Optional segment to update
 * @param options - Optional processing options including cache settings
 * @returns Promise resolving to an array of processed components
 */
export declare function processComponents(handoff: Handoff, id?: string, segmentToProcess?: ComponentSegment, options?: ProcessComponentsOptions): Promise<ComponentListObject[]>;
export default processComponents;
