/// <reference types="node" />
import archiver from 'archiver';
import * as stream from 'node:stream';
/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
export declare const getPathToIntegration: () => string;
export declare const getIntegrationName: () => any;
/**
 * Find the integration to sync and sync the sass files and template files.
 */
export default function integrationTransformer(): Promise<void>;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
export declare const zipTokens: (dirPath: string, destination: stream.Writable) => Promise<stream.Writable>;
/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
export declare const addFileToZip: (directory: string[], dirPath: string, archive: archiver.Archiver) => Promise<archiver.Archiver>;
