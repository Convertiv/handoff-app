import { DocumentationObject } from '../../../types';
import { HookReturn } from '../../../types';
import webpack from 'webpack';
import { ExportableTransformerOptionsMap } from '../../types';
export declare const modifyWebpackConfigForTailwind: (webpackConfig: webpack.Configuration) => webpack.Configuration;
export declare const postTailwindIntegration: (documentationObject: DocumentationObject, artifact: HookReturn[], options?: ExportableTransformerOptionsMap) => HookReturn[];
