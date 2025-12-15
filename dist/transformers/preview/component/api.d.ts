import Handoff from '../../../index';
import { ComponentListObject, TransformComponentTokensResult } from '../types';
export declare const getAPIPath: (handoff: Handoff) => string;
/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
declare const writeComponentSummaryAPI: (handoff: Handoff, componentData: ComponentListObject[]) => Promise<void>;
export declare const writeComponentApi: (id: string, component: TransformComponentTokensResult, handoff: Handoff, preserveKeys?: string[]) => Promise<void>;
/**
 * Update the main component summary API with the new component data
 * @param handoff
 * @param componentData
 */
export declare const updateComponentSummaryApi: (handoff: Handoff, componentData: ComponentListObject[], isFullRebuild?: boolean) => Promise<void>;
/**
 * Read the component API data
 * @param handoff
 * @param id
 * @returns
 */
export declare const readComponentApi: (handoff: Handoff, id: string) => Promise<TransformComponentTokensResult | null>;
/**
 * Read the component metadata/summary from the component JSON file
 * @param handoff
 * @param id
 * @returns The component summary or null if not found
 */
export declare const readComponentMetadataApi: (handoff: Handoff, id: string) => Promise<ComponentListObject | null>;
export default writeComponentSummaryAPI;
