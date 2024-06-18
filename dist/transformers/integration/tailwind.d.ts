import { HookReturn } from '../../types';
import webpack from 'webpack';
export declare const modifyWebpackConfigForTailwind: (handoff: Handoff, webpackConfig: webpack.Configuration) => webpack.Configuration;
export declare const postTailwindIntegration: (documentationObject: DocumentationObject, artifacts: HookReturn[]) => HookReturn[];
