import { LegacyComponentDefinition } from '../../types';
import { FileComponentsObject } from './types';
export declare const getFigmaFileComponents: (fileId: string, accessToken: string, legacyDefinitions?: LegacyComponentDefinition[]) => Promise<FileComponentsObject>;
