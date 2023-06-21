import Handoff from '.';
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
declare const buildApp: (handoff: Handoff) => Promise<void>;
/**
 * Export the next js application
 * @param handoff
 * @returns
 */
export declare const exportNext: (handoff: Handoff) => Promise<void>;
/**
 * Watch the next js application
 * @param handoff
 */
export declare const watchApp: (handoff: Handoff) => Promise<void>;
export default buildApp;
