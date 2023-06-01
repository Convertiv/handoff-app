/** @type {import('handoff-app/client-config').Plugin} */
sandbox.exports = {
  /**
   * This fires when the pipeline starts and returns void
   */
  init: () => {},
  /**
   * This hook fires after the scss transformer and returns the scss object,
   * allowing the plugin to modify the css output
   *
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject
   * @param {import("handoff-app/figma-exporter/src/transformers/css").CssTransformerOutput} css
   * @returns import("handoff-app/figma-exporter/src/transformers/css").CssTransformerOutput
   */
  postCssTransformer: (documentationObject, css) => css,
  /**
   * This hook fires after the scss transformer and returns the scss object,
   * allowing the plugin to modify the scss output
   *
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject
   * @param {import("handoff-app/figma-exporter/src/transformers/css").CssTransformerOutput} css
   * @returns import("handoff-app/figma-exporter/src/transformers/css").CssTransformerOutput
   */
  postScssTransformer: (documentationObject, scss) => scss,
  /**
   * This hook fires after the scs type transformer and returns the types object,
   * allowing the plugin to modify the types output
   *
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject
   * @param {import("handoff-app/figma-exporter/src/transformers/css").CssTransformerOutput} types
   * @returns import("handoff-app/figma-exporter/src/transformers/css").CssTransformerOutput
   */
  postTypesTransformer: (documentationObject, types) => types,
  /**
   * This fires after the figma extraction and returns void
   * 
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject
   * @returns void
   */
  postExtract: (documentationObject) => {},
  /**
   * This fires after the preview is generated and returns the preview object
   * 
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject 
   * @param {import("handoff-app/figma-exporter/src/transformers/preview").TransformedPreviewComponents} previews
   * @returns import("handoff-app/figma-exporter/src/transformers/preview").TransformedPreviewComponents
   */
  postPreview: (documentationObject, previews) => previews,
  /**
   * This fires after the build is complete and returns void
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject 
   * @param {import("handoff-app/figma-exporter/src/transformers/preview").TransformedPreviewComponents} previews
   * @returns void
   */
  postBuild: (documentationObject) => {
    console.log("custom build hook");
  },
  /**
   * This fires after the fonts is complete and returns an array of font names
   * 
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject 
   * @param {string[]} customFonts
   * @returns string[]
   */
  postFont: (documentationObject, customFonts) => customFonts,
  /**
   * This allows you to modify the webpack config before it is used
   * 
   * @param {Configuration} webpackConfig 
   * @returns Configuration
   */
  modifyWebpackConfig: (webpackConfig) => {
    return webpackConfig;
  },

  /**
   * This executes after the integration code is complete, and lets you modify
   * the application with the fully formed integration in place. 
   * 
   * You can return an array of HookReturn objects to add additional files. 
   * The HookReturn is an object with the following properties:
   * filename: string; // Relative to the root of your project
   * data: string; // Data to write to that file
   * 
   * @param {import("handoff-app/figma-exporter/src/types").DocumentationObject} documentationObject 
   * @returns HookReturn[]
   */
  postIntegration: (documentationObject) => {
    return [];
  },
};
