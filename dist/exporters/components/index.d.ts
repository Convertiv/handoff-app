import { LegacyComponentDefinition } from '../../types.js';
import { FileComponentsObject } from './types.js';
export declare const getFigmaFileComponents: (fileId: string, accessToken: string, legacyDefinitions?: LegacyComponentDefinition[]) => Promise<FileComponentsObject>;
