import Handoff from '.';
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
declare const buildApp: (handoff: Handoff) => Promise<void>;
/**
 * Watch the next js application.
 * Starts a custom dev server with Handoff-specific watchers and hot-reloading.
 *
 * @param handoff
 */
export declare const watchApp: (handoff: Handoff) => Promise<void>;
/**
 * Watch the next js application using the standard Next.js dev server.
 * This is useful for debugging the Next.js app itself without the Handoff overlay.
 *
 * @param handoff
 */
export declare const devApp: (handoff: Handoff) => Promise<void>;
export default buildApp;
