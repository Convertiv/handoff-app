/// <reference types="node" />
import archiver from 'archiver';
import * as stream from 'node:stream';
import { DocumentationObject } from '../../types';
import { TransformedPreviewComponents } from '../preview/types';
import webpack from 'webpack';
import { HookReturn } from '../../types';
import Handoff from '../../index';
export declare class HandoffIntegration {
    name?: string;
    hooks: {
        integration: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[];
        webpack: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration;
        preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
    };
    constructor(name?: string);
    postIntegration(callback: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[]): void;
    modifyWebpackConfig(callback: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration): void;
    postPreview(callback: (documentationObject: DocumentationObject, previews: TransformedPreviewComponents) => TransformedPreviewComponents): void;
}
/**
 * Derive the path to the integration.
 */
export declare const getPathToIntegration: (handoff: Handoff, resolveTemplatePath: boolean) => string | null;
/**
 * Get the entry point for the integration
 * @returns string
 */
export declare const getIntegrationEntryPoint: (handoff: Handoff) => string | null;
export declare const instantiateIntegration: (handoff: Handoff) => HandoffIntegration;
/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
export declare const addFileToZip: (directory: string[], dirPath: string, archive: archiver.Archiver) => Promise<archiver.Archiver>;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
export declare const zipTokens: (dirPath: string, destination: stream.Writable) => Promise<stream.Writable>;
/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
export default function integrationTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<void>;
