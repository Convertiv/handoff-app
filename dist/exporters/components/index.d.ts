import { LegacyComponentDefinition } from '../../types';
import { FileComponentsObject } from './types';
import Handoff from '../../index';
/**
 * Given a component set, returns an array of objects containing the component
 * @param handoff
 * @param legacyDefinitions
 * @returns
 */
export declare const getFigmaFileComponents: (handoff: Handoff, legacyDefinitions?: LegacyComponentDefinition[]) => Promise<FileComponentsObject>;
