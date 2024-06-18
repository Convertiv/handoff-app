import { DocumentationObject } from '../../types.js';
import { HookReturn } from '../../types.js';
import webpack from 'webpack';
import Handoff from '../../index.js';
export declare const modifyWebpackConfigForTailwind: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration;
export declare const postTailwindIntegration: (documentationObject: DocumentationObject, artifacts: HookReturn[]) => HookReturn[];
