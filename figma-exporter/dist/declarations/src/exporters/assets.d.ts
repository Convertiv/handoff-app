/// <reference types="node" />
import * as stream from 'node:stream';
import { AssetObject } from '../types';
declare const assetsExporter: (fileId: string, accessToken: string, component: string) => Promise<AssetObject[]>;
export declare const zipAssets: (assets: AssetObject[], destination: stream.Writable) => Promise<stream.Writable>;
export default assetsExporter;
