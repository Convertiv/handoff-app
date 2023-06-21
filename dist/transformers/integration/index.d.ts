/// <reference types="node" />
import archiver from 'archiver';
import * as stream from 'node:stream';
import { DocumentationObject } from '../../types';
import { TransformedPreviewComponents } from '../preview';
import webpack from 'webpack';
import { HookReturn } from '../../types/plugin';
import Handoff from '../../index';
export declare class HandoffIntegration {
    name: string;
    version: string;
    hooks: {
        integration: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[];
        webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
        preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
    };
    constructor(name: string, version: string);
    postIntegration(callback: (documentationObject: DocumentationObject, artifact: HookReturn[]) => HookReturn[]): void;
    modifyWebpackConfig(callback: (webpackConfig: webpack.Configuration) => webpack.Configuration): void;
    postPreview(callback: (documentationObject: DocumentationObject, previews: TransformedPreviewComponents) => TransformedPreviewComponents): void;
}
/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
export declare const getPathToIntegration: () => string;
/**
 * Get the entry point for the integration
 * @returns string
 */
export declare const getIntegrationEntryPoint: () => string;
/**
 * Get the name of the current integration
 * @returns string
 */
export declare const getIntegrationName: () => string;
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
export default function integrationTransformer(documentationObject: DocumentationObject): Promise<void>;
