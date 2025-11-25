import Handoff from '../../../index';
import { ComponentListObject, TransformComponentTokensResult } from '../types';
export declare const getAPIPath: (handoff: Handoff) => string;
/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
declare const writeComponentSummaryAPI: (handoff: Handoff, componentData: ComponentListObject[]) => Promise<void>;
export declare const writeComponentApi: (id: string, component: TransformComponentTokensResult, version: string, handoff: Handoff, preserveKeys?: string[]) => Promise<void>;
export declare const writeComponentMetadataApi: (id: string, summary: ComponentListObject, handoff: Handoff) => Promise<void>;
/**
 * Update the main component summary API with the new component data
 * @param handoff
 * @param componentData
 */
export declare const updateComponentSummaryApi: (handoff: Handoff, componentData: ComponentListObject[], isFullRebuild?: boolean) => Promise<void>;
/**
 * Read the component API data for a specific version
 * @param handoff
 * @param id
 * @param version
 * @returns
 */
export declare const readComponentApi: (handoff: Handoff, id: string, version: string) => Promise<TransformComponentTokensResult | null>;
export default writeComponentSummaryAPI;
