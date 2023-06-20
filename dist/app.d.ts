import Handoff from '.';
declare const buildApp: (handoff: Handoff) => Promise<void>;
export declare const exportNext: (handoff: Handoff) => Promise<void>;
/**
 *
 * @param handoff
 */
export declare const watchApp: (handoff: Handoff) => Promise<void>;
export default buildApp;
