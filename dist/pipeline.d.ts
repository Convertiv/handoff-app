/// <reference types="node" />
import 'dotenv/config';
import { Types as HandoffTypes } from 'handoff-core';
import * as stream from 'node:stream';
import Handoff from '.';
/**
 * Read Previous Json File
 * @param path
 * @returns
 */
export declare const readPrevJSONFile: (path: string) => Promise<any>;
export declare const zipAssets: (assets: HandoffTypes.IAssetObject[], destination: stream.Writable) => Promise<stream.Writable>;
/**
 * Build previews
 * @param documentationObject
 * @returns
 */
export declare const buildComponents: (handoff: Handoff) => Promise<void>;
/**
 * Run the entire pipeline
 */
declare const pipeline: (handoff: Handoff, build?: boolean) => Promise<void>;
export default pipeline;
