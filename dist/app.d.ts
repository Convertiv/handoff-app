/**
 * Build the next js application
 * @param handoff
 * @returns
 */
declare const buildApp: (handoff: Handoff) => Promise<void>;
/**
 * Watch the next js application
 * @param handoff
 */
export declare const watchApp: (handoff: Handoff) => Promise<void>;
/**
 * Watch the next js application
 * @param handoff
 */
export declare const devApp: (handoff: Handoff) => Promise<void>;
export default buildApp;
