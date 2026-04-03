const { defineConfig } = require('handoff-app');
/** @typedef {import('handoff-app').Config} HandoffConfig */

/** @type {HandoffConfig} */
const config = {
  app: {
    theme: "default",
    title: "{{projectName}} Design System",
    client: "{{projectName}}",
    googleTagManager: null,
    attribution: true,
    typeCopy: "Almost before we knew it, we had left the ground.",
    typeSort: [
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Heading 4",
      "Heading 5",
      "Heading 6",
      "Paragraph",
      "Subheading",
      "Blockquote",
      "Input Labels",
      "Link"
    ],
    colorSort: [
      "primary",
      "secondary",
      "extra",
      "system"
    ],
    componentSort: [
      "primary",
      "secondary",
      "transparent"
    ],
    basePath: "",
    breakpoints: {
      mobile: { size: 400, name: "Mobile" },
      tablet: { size: 800, name: "Medium" },
      desktop: { size: 1100, name: "Large" }
    }
  },

  // entries: {
  //   /**
  //    * Array of component paths to be included in the build.
  //    * Each path should point to a directory containing a *.handoff.ts declaration.
  //    */
  //   components: ["components/button"],
  //
  //   /**
  //    * Array of pattern paths to be included in the build.
  //    * Patterns compose multiple component previews into single-page views.
  //    * Each path should point to a directory containing a *.handoff.ts declaration
  //    * that uses definePattern().
  //    *
  //    * @example
  //    * patterns: ["patterns/hero-section", "patterns"]
  //    */
  //   patterns: ["patterns"],
  // },

  // Optional handoff-docgen settings used by component docs generation
  // reactDocgen: {
  //   maxDepth: 7,
  //   excludeDirectories: ["dist", "build", ".next"]
  // },

  hooks: {
    /**
     * Optional validation callback for components
     * @param component - The component instance to validate
     * @returns A record of validation results where keys are validation types and values are detailed validation results
     *
     * @example
     * validateComponent: async (component) => ({
     *   a11y: {
     *     description: 'Accessibility validation check',
     *     passed: true,
     *     messages: ['No accessibility issues found']
     *   },
     *   responsive: {
     *     description: 'Responsive design validation',
     *     passed: false,
     *     messages: ['Component breaks at mobile breakpoint']
     *   }
     * })
     */
    // validateComponent: async (component) => {
    //   // Add your custom validation logic here
    //   return {};
    // },

    /**
     * Optional hook to override the SSR build configuration used in the ssrRenderPlugin
     * @param config - The default esbuild configuration
     * @returns Modified esbuild configuration
     *
     * @example
     * ssrBuildConfig: (config) => {
     *   // Modify the esbuild config as needed
     *   return config;
     * }
     */
    // ssrBuildConfig: (config) => {
    //   // Add your custom SSR build configuration here
    //   return config;
    // },

    /**
     * Optional hook to override the client-side build configuration used in the ssrRenderPlugin
     * @param config - The default esbuild configuration
     * @returns Modified esbuild configuration
     *
     * @example
     * clientBuildConfig: (config) => {
     *   // Modify the esbuild config as needed
     *   return config;
     * }
     */
    // clientBuildConfig: (config) => {
    //   // Add your custom client build configuration here
    //   return config;
    // },

    /**
     * Optional hook to specify which export property contains the schema
     * @param exports - The module exports object containing the schema
     * @returns The schema object from the exports
     *
     * @example
     * getSchemaFromExports: (exports) => exports.customSchema || exports.default
     */
    // getSchemaFromExports: (exports) => {
    //   // Add your custom schema extraction logic here
    //   return exports.default;
    // },

    /**
     * Optional hook to transform the schema into properties
     * @param schema - The schema object to transform
     * @returns The transformed properties object
     */
    // schemaToProperties: (schema) => {
    //   // Add your custom schema to properties transformation here
    //   return {};
    // },

    /**
     * Optional hook to override the JavaScript Vite configuration
     * @param config - The default Vite configuration
     * @returns Modified Vite configuration
     *
     * @example
     * jsBuildConfig: (config) => {
     *   // Modify the Vite config as needed
     *   return config;
     * }
     */
    // jsBuildConfig: (config) => {
    //   // Add your custom JavaScript build configuration here
    //   return config;
    // },

    /**
     * Optional hook to override the CSS Vite configuration
     * @param config - The default Vite configuration
     * @returns Modified Vite configuration
     *
     * @example
     * cssBuildConfig: (config) => {
     *   // Modify the Vite config as needed
     *   return config;
     * }
     */
    // cssBuildConfig: (config) => {
    //   // Add your custom CSS build configuration here
    //   return config;
    // },

    /**
     * Optional hook to override the HTML Vite configuration
     * @param config - The default Vite configuration
     * @returns Modified Vite configuration
     *
     * @example
     * htmlBuildConfig: (config) => {
     *   // Modify the Vite config as needed
     *   return config;
     * }
     */
    // htmlBuildConfig: (config) => {
    //   // Add your custom HTML build configuration here
    //   return config;
    // },

    /**
     * Optional hook run after built-in Handlebars helpers (`field`, `eq`) for preview HTML.
     * @param context.handlebars - Handlebars module (use registerHelper)
     * @param context.componentId - Current component id
     * @param context.properties - Slot metadata map from the schema
     * @param context.injectFieldWrappers - True when generating inspect-mode previews
     *
     * @example
     * registerHandlebarsHelpers: ({ handlebars, componentId }) => {
     *   handlebars.registerHelper('upperId', () => componentId.toUpperCase());
     * }
     */
    // registerHandlebarsHelpers: ({ handlebars, componentId, properties, injectFieldWrappers }) => {
    //   // Add your custom Handlebars helpers here
    // },
  },
};

module.exports = defineConfig(config);
