import Handoff from "../index.js";
/**
 * Eject the config to the working directory
 * @param handoff
 */
export declare const ejectConfig: (handoff: Handoff) => Promise<Handoff>;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export declare const ejectIntegration: (handoff: Handoff) => Promise<Handoff>;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export declare const ejectExportables: (handoff: Handoff) => Promise<Handoff>;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export declare const ejectPages: (handoff: Handoff) => Promise<Handoff>;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export declare const ejectTheme: (handoff: Handoff) => Promise<Handoff>;
export default ejectConfig;
