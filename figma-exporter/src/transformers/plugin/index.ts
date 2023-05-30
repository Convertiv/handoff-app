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
export const genericPluginGenerator = (): PluginTransformer => {
  return {
    init: (): void => {},
    postCssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput): void => {},
    postScssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput): void => {},
    postExtract: (documentationObject: DocumentationObject): void => {},
    // Integrates data
    postIntegration: (documentationObject: DocumentationObject): HookReturn[] | void => {},
    // Builds the preview
    postPreview: (documentationObject: DocumentationObject): void => { },
    postFont: (documentationObject: DocumentationObject, customFonts: string[]): void => { },
    modifyWebpackConfig: (webpackConfig): webpack.Configuration => {
      return webpackConfig;
    },
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
  let generic = genericPluginGenerator();
  const pluginPath = getPathToIntegration() + '/plugin.js';
  let plugin = generic;

  if (fs.existsSync(pluginPath)) {
    console.log(pluginPath);
    const custom = await evaluatePlugin(pluginPath)
      .then((globalVariables) => globalVariables)
      .catch((err) => {
        console.error(err);
        return generic;
      });
    plugin = { ...generic, ...custom };
  }
  return plugin;
};

/**
 * Attempts to read a plugin file and then evaluate it in a sandboxed context
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
        vm.run(data, file);
        resolve(sandbox.exports as unknown as PluginTransformer);
      } catch (e) {
        reject(e);
      }
    });
  });
}