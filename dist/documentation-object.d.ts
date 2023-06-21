import { DocumentationObject, ExportableDefinition } from './types';
export declare const createDocumentationObject: (figmaFileKey: string, figmaAccessToken: string, exportables: ExportableDefinition[]) => Promise<DocumentationObject>;
