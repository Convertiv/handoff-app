// @ts-check

/** @type {import('handoff-app/client-config').Config} */
const config = {
  title: 'Demo Design System', // The Title of your project
  client: 'Demo Software', // The name of your org
  google_tag_manager: null, // A GTM tag id. If null, GTM will not be added
  integration: {
    // Integration exports a prebuild token map
    name: 'bootstrap', // Pick the integration type (bootstrap)
    version: '5.2', // Pick the integration version
  },
  figma: { // figma allows you to customize the way handoff fetches from figma.
    size: [
      // Component size map allows you to map figma
      {
        // size names (small, medium, large) to customize
        figma: 'small', // your token names to match the sizes used
        css: 'sm', // in your project like (sm, md, lg)
      },
      {
        figma: 'medium',
        css: 'md',
      },
      {
        figma: 'large',
        css: 'lg',
      },
    ],
    components: {
      alert: {
        // Customize the alert fetch
        search: 'Alert', // Search for alerts in a frame called Alert
      },
      button: {
        search: 'Button',
      },
      checkbox: {
        search: 'Checkbox',
      },
      input: {
        search: 'Input',
      },
      modal: {
        search: 'Modal',
      },
      pagination: null,
      radio: {
        search: 'Radio',
      },
      select: {
        search: 'Select',
      },
      switch: {
        search: 'Switch',
      },
      tooltip: {
        search: 'Tooltip',
      },
    },
  },
  poweredBy: true, // Show Powered By Handoff at the bottom of the site
  logo: '/logo.svg', // The logo to use on the site
  favicon: '/favicon.ico', // The Favicon for the site
  type_sort: [
    // The preferred type sorting
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
  // Containers for holding design elements. This object will be overwritten on fetch
  design: { color: [], typography: [], effect: [] },
  // Containers for holding assets. This object will be overwritten on fetch
  assets: { icons: [], logos: [] },
  // The sample text to use on the typography page
  type_copy: 'Almost before we knew it, we had left the ground.',
  // The sort order of the color types
  color_sort: ['primary', 'secondary', 'extra', 'system'],
  // The sort order of the component types
  component_sort: ['primary', 'secondary', 'transparent'],
};

module.exports = config;
