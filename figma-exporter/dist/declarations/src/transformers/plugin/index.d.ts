import { DocumentationObject } from '../../types';
import { CssTransformerOutput } from '../css';
import webpack from 'webpack';
import { TransformedPreviewComponents } from '../preview';
/**
 * This is the plugin transformer.  It will attempt to read the plugin folder
 * in the selected integration and then expose a set of hooks that will be
 * fired by the figma-exporter pipeline.
 */
export interface PluginTransformer {
    init: () => void;
    postExtract: (documentationObject: DocumentationObject) => void;
    postTypeTransformer: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput;
    postCssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => CssTransformerOutput;
    postScssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => CssTransformerOutput;
    postIntegration: (documentationObject: DocumentationObject) => HookReturn[] | void;
    modifyWebpackConfig: (webpackConfig: webpack.Configuration) => webpack.Configuration;
    postPreview: (documentationObject: DocumentationObject, previews: TransformedPreviewComponents) => TransformedPreviewComponents;
    postFont: (documentationObject: DocumentationObject, customFonts: string[]) => string[];
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
