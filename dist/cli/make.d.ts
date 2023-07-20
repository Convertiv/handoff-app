import Handoff from '../index';
/**
 * Make a new exportable component
 * @param handoff
 */
export declare const makeExportable: (handoff: Handoff, type: string, name: string) => Promise<Handoff | undefined>;
/**
 * Make a new exportable component
 * @param handoff
 */
export declare const makeTemplate: (handoff: Handoff, component: string, state: string) => Promise<Handoff | undefined>;
