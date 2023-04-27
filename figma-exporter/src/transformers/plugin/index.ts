import * as fs from 'fs';
import * as vm from 'vm';
import { DocumentationObject } from '../../types';
import { CssTransformerOutput } from '../css';
import { getPathToIntegration } from '../integration';

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
export const genericPluginGenerator = (): PluginTransformer => {
  return {
    init: (): void => {},
    postCssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput): void => {},
    postScssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput): void => {},
    postExtract: (documentationObject: DocumentationObject): void => {},
    postIntegration: (documentationObject: DocumentationObject): void => {},
    postPreview: (documentationObject: DocumentationObject): void => {},
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
    const custom = await evaluatePlugin('example.js')
      .then((globalVariables) => globalVariables)
      .catch((err) => generic);
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
      const context: { [key: string]: any } = {};
      const script = new vm.Script(data);
      const sandbox = vm.createContext(context);
      try {
        script.runInContext(sandbox);
        const globalVariables = Object.entries(sandbox).map(([key, value]) => {
          return { [key]: value };
        });
        resolve(globalVariables as unknown as PluginTransformer);
      } catch (e) {
        reject(e);
      }
    });
  });
}
