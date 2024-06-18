/// <reference types="node" resolution-mode="require"/>
import { DocumentationObject } from '../../types.js';
import * as stream from 'node:stream';
import Handoff from '../../index.js';
/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
export default function fontTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<void>;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
export declare const zipFonts: (dirPath: string, destination: stream.Writable) => Promise<stream.Writable>;
