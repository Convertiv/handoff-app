import { DocumentationObject } from '../../types';
import { CssTransformerOutput } from '../css';
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
    postIntegration: (documentationObject: DocumentationObject) => void;
    postPreview: (documentationObject: DocumentationObject) => void;
    postBuild: (documentationObject: DocumentationObject) => void;
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
