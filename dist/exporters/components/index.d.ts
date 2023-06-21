import * as FigmaTypes from '../../figma/types';
import { ExportableDefinition } from '../../types';
import { Component } from './extractor';
export interface DocumentComponentsObject {
    [key: string]: Component[];
}
export interface GetComponentSetComponentsResult {
    components: FigmaTypes.Component[];
    metadata: {
        [k: string]: FigmaTypes.ComponentMetadata;
    };
}
declare const getFileComponentTokens: (fileId: string, accessToken: string, exportables: ExportableDefinition[]) => Promise<DocumentComponentsObject>;
export default getFileComponentTokens;
