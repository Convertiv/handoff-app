import { CssTransformerOutput } from 'figma-exporter/src/transformers/css';
import type {  DocumentationObject } from './figma-exporter/src/types';
//import { HookReturn } from 'figma-exporter/src/transformers/plugin';
import { webpack } from 'webpack';

export interface Plugin {
  init: () => void;
  postExtract: (documentationObject: DocumentationObject) => void;
  postCssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => void;
  postScssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => void;
  postIntegration: (documentationObject: DocumentationObject) => HookReturn[] | void;
  modifyWebpackConfig: (webpackConfig: webpack.Configuration) => webpack.Configuration;
  postPreview: (documentationObject: DocumentationObject) => void;
  postFont: (documentationObject: DocumentationObject, customFonts: string[]) => void;
  postBuild: (documentationObject: DocumentationObject) => void;
}

export interface HookReturn {
  filename: string;
  data: string;
}