import { DocumentationObject } from '../../types';
import { HookReturn } from '../../types';
import webpack from 'webpack';
import Handoff from '../../index';
export declare const modifyWebpackConfigForTailwind: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration;
export declare const postTailwindIntegration: (documentationObject: DocumentationObject, artifacts: HookReturn[]) => HookReturn[];
