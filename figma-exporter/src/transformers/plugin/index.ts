import * as fs from 'fs';
import { NodeVM } from 'vm2';
import { DocumentationObject } from '../../types';
import { CssTransformerOutput } from '../css';
import { getPathToIntegration } from '../integration';
import webpack from 'webpack';

/**
 * This is the plugin transformer.  It will attempt to read the plugin folder
 * in the selected integration and then expose a set of hooks that will be
 * fired by the figma-exporter pipeline.
 */
export interface PluginTransformer {
  init: () => void;
  postExtract: (documentationObject: DocumentationObject) => void;
  postCssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => void;
  postScssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => void;
  postIntegration: (documentationObject: DocumentationObject) => HookReturn | void;
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
export const genericPluginGenerator = (): PluginTransformer => {
  return {
    // Initializes the plugin
    init: (): void => {
      console.log('init generic');
    },
    // Transforms postcss
    postCssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput): void => {},
    // Transforms scss
    postScssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput): void => {},
    // Extracts data
    postExtract: (documentationObject: DocumentationObject): void => {},
    // Integrates data
    postIntegration: (documentationObject: DocumentationObject): HookReturn | void => {},
    // Builds the preview
    postPreview: (documentationObject: DocumentationObject): void => { },
    // Adds custom fonts
    postFont: (documentationObject: DocumentationObject, customFonts: string[]): void => { },
    // Modifies webpack config
    modifyWebpackConfig: (webpackConfig): webpack.Configuration => {
      return webpackConfig;
    },
    // Builds the documentation
    postBuild: (documentationObject: DocumentationObject): void => {},
  };
};

/**
 * Creates a plugin transformer merging the generic plugin with the custom
 * plugin and then allowing it to execute in all contexts
 * @param documentationObject
 * @returns
 */
export const pluginTransformer = async (): Promise<PluginTransformer> => {
  // Generic plugin that can be used as fallback
  let generic = genericPluginGenerator();

  // Path where the custom plugin is located
  const pluginPath = getPathToIntegration() + '/plugin.js';

  // Default plugin
  let plugin = generic;

  // Check if the custom plugin exists
  if (fs.existsSync(pluginPath)) {

    // Evaluate and load the plugin
    const custom = await evaluatePlugin(pluginPath)
      .then((globalVariables) => globalVariables)
      .catch((err) => {
        console.error(err);
        return generic;
      });

    // Merge the generic plugin and the custom plugin
    plugin = { ...generic, ...custom };
  }

  // Return the plugin
  return plugin;
};

/**
 * Attempts to read a plugin file and then evaluate it in a sandboxed context.
 * This is not a secure sandbox, and should not be used to run untrusted code.
 * @param file
 * @returns
 */
async function evaluatePlugin(file: string): Promise<PluginTransformer> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      // The sandbox is a place to run the plugin's code.
      const sandbox: {exports?: PluginTransformer} = {};
      const vm = new NodeVM({
        console: 'inherit',
        sandbox: { sandbox },
        require: {
          external: true,
          builtin: ['fs', 'path'],
          root: './',
        },
      });
      try {
        // Run the plugin's code in the sandbox.
        vm.run(data, file);
        // The plugin must export a function called "transform".
        resolve(sandbox.exports as unknown as PluginTransformer);
      } catch (e) {
        reject(e);
      }
    });
  });
}
