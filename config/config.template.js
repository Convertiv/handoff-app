/** @type {import('handoff-app').Config} */
const path = require('path');
module.exports = {
  // Set your Figma project ID here or in the environment variable HANDOFF_FIGMA_PROJECT_ID
  figma_project_id: null,
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
    google_tag_manager: null,
    // Set the attribution for the application
    attribution: true, // Should we remove this?
    // Set the type copy for the typeography page
    type_copy: 'Almost before we knew it, we had left the ground.',
    // Set the type sort for the typeography page
    type_sort: [
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
    color_sort: ['primary', 'secondary', 'extra', 'system'],
    // Set the component sort for the component page
    component_sort: ['primary', 'secondary', 'transparent'],
    // Set the base path for the application
    base_path: '',
    // Set the breakpoints for the application
    breakpoints: {
      sm: { size: 576, name: 'Small' },
      md: { size: 768, name: 'Medium' },
      lg: { size: 992, name: 'Large' },
      xl: { size: 1200, name: 'Extra Large' },
    },
    // Set the ports for the application
    ports: { app: 3000, websocket: 3001 },
  },
  // These are the entry points used to compile the target application
  entries: {
    scss: './sass/main.scss',
    js: './js/main.js',
    bundle: './js/main.js',
    components: ['./integration/components'],
  },
  // These are the asset zip file download links
  assets_zip_links: {
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
