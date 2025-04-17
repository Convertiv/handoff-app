import 'dotenv/config';
import Handoff from '.';
export declare const outputPath: (handoff: Handoff) => string;
export declare const tokensFilePath: (handoff: Handoff) => string;
export declare const previewFilePath: (handoff: Handoff) => string;
export declare const changelogFilePath: (handoff: Handoff) => string;
export declare const variablesFilePath: (handoff: Handoff) => string;
export declare const iconsZipFilePath: (handoff: Handoff) => string;
export declare const logosZipFilePath: (handoff: Handoff) => string;
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
export declare const buildRecipe: (handoff: Handoff) => Promise<void>;
/**
 * Build only integrations and previews
 * @param handoff
 */
export declare const buildIntegrationOnly: (handoff: Handoff) => Promise<void>;
/**
 * Run the entire pipeline
 */
declare const pipeline: (handoff: Handoff, build?: boolean) => Promise<void>;
export default pipeline;
