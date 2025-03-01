import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildComponentJs: (id: string, location: string, data: TransformComponentTokensResult, handoff: Handoff) => Promise<TransformComponentTokensResult>;
/**
 * Check to see if there's an entry point for the main JS file
 * build that javascript and write it to the output folder
 * @param handoff
 */
export declare const buildMainJS: (handoff: Handoff) => Promise<void>;
export default buildComponentJs;
