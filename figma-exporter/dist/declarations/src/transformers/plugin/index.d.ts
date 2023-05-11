import { DocumentationObject } from '../../types';
import { CssTransformerOutput } from '../css';
import webpack from 'webpack';
/**
 * This is the plugin transformer.  It will attempt to read the plugin folder
 * in the selected integration and then expose a set of hooks that will be
 * fired by the figma-exporter pipeline.
 */
/**
 * The plugin transformer interface describing what a plugin function set should
 * be. Each function will be called at a different point in the pipeline.
 */
export interface PluginTransformer {
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
/**
 * Generate a generic plugin transformer that does nothing
 * @returns
 */
export declare const genericPluginGenerator: () => PluginTransformer;
/**
 * Creates a plugin transformer merging the generic plugin with the custom
 * plugin and then allowing it to execute in all contexts
 * @param documentationObject
 * @returns
 */
export declare const pluginTransformer: () => Promise<PluginTransformer>;
