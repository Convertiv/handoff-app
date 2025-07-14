import Handoff from '../../../index';
import { ComponentListObject, TransformComponentTokensResult } from '../types';
export declare const getAPIPath: (handoff: Handoff) => string;
/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
declare const writeComponentSummaryAPI: (handoff: Handoff, componentData: ComponentListObject[]) => Promise<void>;
export declare const writeComponentApi: (id: string, component: TransformComponentTokensResult, version: string, handoff: Handoff, isPartialUpdate?: boolean) => Promise<void>;
export declare const writeComponentMetadataApi: (id: string, summary: ComponentListObject, handoff: Handoff) => Promise<void>;
/**
 * Update the main component summary API with the new component data
 * @param handoff
 * @param componentData
 */
export declare const updateComponentSummaryApi: (handoff: Handoff, componentData: ComponentListObject[]) => Promise<void>;
export default writeComponentSummaryAPI;
