import Handoff from '../index';
/**
 * Make a new exportable component
 * @param handoff
 */
export declare const makeTemplate: (handoff: Handoff, component: string, state: string) => Promise<Handoff>;
/**
 * Make a new docs page
 * @param handoff
 */
export declare const makePage: (handoff: Handoff, name: string, parent: string | undefined) => Promise<Handoff>;
/**
 * Make a new component
 * @param handoff
 */
export declare const makeComponent: (handoff: Handoff, name: string) => Promise<Handoff>;
