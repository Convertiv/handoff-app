import { TransformerOutput } from './figma-exporter/src/transformers/types.js';
import type {  DocumentationObject } from './figma-exporter/src/types.js';
//import { HookReturn } from 'figma-exporter/src/transformers/plugin';
import { webpack } from 'webpack';

export interface Plugin {
  init: () => void;
  postExtract: (documentationObject: DocumentationObject) => void;
  postCssTransformer: (documentationObject: DocumentationObject, css: TransformerOutput) => void;
  postScssTransformer: (documentationObject: DocumentationObject, scss: TransformerOutput) => void;
  postIntegration: (documentationObject: DocumentationObject) => HookReturn[] | void;
  modifyWebpackConfig: (webpackConfig: webpack.Configuration) => webpack.Configuration;
  postPreview: (documentationObject: DocumentationObject) => void;
  postFont: (documentationObject: DocumentationObject, customFonts: string[]) => void;
  postBuild: (documentationObject: DocumentationObject) => void;
}

