import 'dotenv/config';
import Handoff from 'handoff/index.js';
/**
 * Build only integrations and previews
 * @param handoff
 */
export declare const buildIntegrationOnly: (handoff: Handoff) => Promise<void>;
/**
 * Build only integrations and previews
 * @param handoff
 */
export declare const buildPreviewOnly: (handoff: Handoff) => Promise<void>;
/**
 * Run the entire pipeline
 */
declare const pipeline: (handoff: Handoff, build?: boolean) => Promise<void>;
export default pipeline;
