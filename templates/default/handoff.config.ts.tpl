import { defineConfig } from 'handoff-app';

export default defineConfig({
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
  //    * Array of component paths to be included in the build
  //    * Add your component directories here
  //    */
  //   components: ["components/button"]
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
  },
});
