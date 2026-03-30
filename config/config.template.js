const path = require('path');
const { defineConfig } = require('handoff-app');
/** @typedef {import('handoff-app').Config} HandoffConfig */

/** @type {HandoffConfig} */
const config = {
  // Set your Figma project ID here or in the environment variable HANDOFF_FIGMA_PROJECT_ID
  figmaProjectId: null,
  // Set the output directory for the exported components
  exportsOutputDirectory: 'exported',
  // Set the output directory for the sites
  sitesOutputDirectory: 'out',
  // These settings control the behavior of the application
  app: {
    // Set the theme for the application
    theme: 'default',
    // Set the title for the application
    title: 'Handoff Design System',
    // Set the client for the application, used in the footer
    client: 'Handoff Technologies',
    // Set the Google Tag Manager ID to add GTM scripts
    googleTagManager: null,
    // Set the attribution for the application
    attribution: true, // Should we remove this?
    // Set the type copy for the typeography page
    typeCopy: 'Almost before we knew it, we had left the ground.',
    // Set the type sort for the typeography page
    typeSort: [
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Heading 4',
      'Heading 5',
      'Heading 6',
      'Paragraph',
      'Subheading',
      'Blockquote',
      'Input Labels',
      'Link',
    ],
    // Set the color sort for the color page
    colorSort: ['primary', 'secondary', 'extra', 'system'],
    // Set the component sort for the component page
    componentSort: ['primary', 'secondary', 'transparent'],
    // Set the base path for the application
    basePath: '',
    // Set the breakpoints for the application
    breakpoints: {
      mobile: { size: 400, name: 'Mobile' },
      tablet: { size: 800, name: 'Medium' },
      desktop: { size: 1100, name: 'Large' },
    },
    // Set the ports for the application
    ports: { app: 3000, websocket: 3001 },
  },
  // These are the entry points used to compile the target application
  entries: {
    scss: './sass/main.scss',
    js: './js/main.js',
    components: ['./components'],
    // Uncomment to enable pattern documentation pages.
    // Patterns compose component previews into single-page views.
    // patterns: ['./patterns'],
  },
  // These are the asset zip file download links
  assetsZipLinks: {
    icons: null,
    logos: null,
  },
  // Hooks allow you to override the default behavior of the application
  hooks: {
    // Alter the vite css build config
    cssBuildConfig: (config) => {
      return config;
    },
    // Validate each component before it is exported
    validateComponent: (component) => {
      return {};
    },
    // Alter the vite client build config
    clientBuildConfig: (config) => {
      return config;
    },
    // Alter the vite html build config
    htmlBuildConfig: (config) => {
      return config;
    },
    // Alter the vite js build config
    jsBuildConfig: (config) => {
      return config;
    },
  },
};

module.exports = defineConfig(config);
