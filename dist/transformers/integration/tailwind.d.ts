import { DocumentationObject } from '../../types';
import { HookReturn } from '../../types';
import webpack from 'webpack';
export declare const modifyWebpackConfigForTailwind: (webpackConfig: webpack.Configuration) => webpack.Configuration;
export declare const postTailwindIntegration: (documentationObject: DocumentationObject, artifacts: HookReturn[]) => HookReturn[];
