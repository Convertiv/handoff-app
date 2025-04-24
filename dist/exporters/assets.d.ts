import * as stream from 'node:stream';
import Handoff from '..';
import { AssetObject } from '../types';
declare const assetsExporter: (fileId: string, accessToken: string, component: string) => Promise<AssetObject[]>;
export declare const writeAssets: (handoff: Handoff, assets: AssetObject[], type: 'logos' | 'icons') => Promise<void>;
export declare const zipAssets: (assets: AssetObject[], destination: stream.Writable) => Promise<stream.Writable>;
export default assetsExporter;
