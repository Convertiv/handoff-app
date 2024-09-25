import webpack from 'webpack';
import path from 'path';
import Handoff from '../index';
export declare const buildClientFiles: (handoff: Handoff) => Promise<string>;
export declare const bundleJSWebpack: (target: string, handoff: Handoff, mode?: 'none' | 'development' | 'production') => Promise<string>;
export declare const generateWebpackConfig: (entry: string, handoff: Handoff, output?: {
    path: string;
    filename: string;
}, mode?: 'none' | 'development' | 'production') => webpack.Configuration;
