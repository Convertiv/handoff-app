import 'dotenv/config';
import Handoff from '.';
/**
 * Read Previous Json File
 * @param path
 * @returns
 */
export declare const readPrevJSONFile: (path: string) => Promise<any>;
/**
 * Build previews
 * @param documentationObject
 * @returns
 */
export declare const buildComponents: (handoff: Handoff) => Promise<void>;
/**
 * Run the entire pipeline
 */
declare const pipeline: (handoff: Handoff, build?: boolean) => Promise<void>;
export default pipeline;
