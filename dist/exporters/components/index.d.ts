import { LegacyComponentDefinition } from '../../types';
import { FileComponentsObject } from './types';
import Handoff from '../../index';
export declare const getFigmaFileComponents: (handoff: Handoff, legacyDefinitions?: LegacyComponentDefinition[]) => Promise<FileComponentsObject>;
