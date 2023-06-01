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
    options: {
      shared: {
        defaults: {
          theme: 'light',
          state: 'default',
          type: 'default',
          activity: '',
          layout: '',
          size: '',
        },
      },
      transformer: {
        replace: {
          size: {
            small: 'sm',
            medium: 'md',
            large: 'lg',
          },
        },
      },
    },
    definitions: [
      'components/alert',
      'components/button',
      'components/modal',
      'components/tooltip',
      'components/checkbox',
      'components/input',
      'components/radio',
      'components/select',
      'components/switch',
    ],
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
