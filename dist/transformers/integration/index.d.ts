import archiver from 'archiver';
import * as stream from 'node:stream';
import Handoff from '../../index';
import { DocumentationObject } from '../../types';
/**
 * Derive the path to the integration.
 */
export declare const getPathToIntegration: (handoff: Handoff, resolveTemplatePath: boolean) => string | null;
/**
 * Get the entry point for the integration
 * @returns string
 */
export declare const getIntegrationEntryPoint: (handoff: Handoff) => string | null;
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
 * @param {Handoff} handoff - The Handoff instance containing configuration and integration data
 * @param {DocumentationObject} documentationObject - The documentation object containing component definitions
 */
export default function integrationTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<void>;
