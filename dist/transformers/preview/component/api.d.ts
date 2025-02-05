import Handoff from '../../../index';
import { ComponentListObject, TransformComponentTokensResult } from '../types';
export declare const getAPIPath: (handoff: Handoff) => string;
/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
declare const writeComponentSummaryAPI: (handoff: Handoff, componentData: ComponentListObject[]) => Promise<void>;
export declare const writeComponentApi: (id: string, component: TransformComponentTokensResult, version: string, handoff: Handoff) => Promise<void>;
export declare const writeComponentMetadataApi: (id: string, summary: ComponentListObject, handoff: Handoff) => Promise<void>;
export default writeComponentSummaryAPI;
