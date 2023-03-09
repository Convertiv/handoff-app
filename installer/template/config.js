// @ts-check

/** @type {import('handoff-app/client-config').Config} */
const config = {
  title: 'Demo Design System',  // The Title of your project
  client: 'Demo Software',      // The name of your org
  google_tag_manager: null,     // A GTM tag id. If null, GTM will not be added
  components: true,             // Enable components
  poweredBy: true,              // Show Powered By Handoff at the bottom of the site
  logo: '/logo.svg',             // The logo to use on the site
  favicon: '/favicon.ico',       // The Favicon for the site
  type_sort: [                  // The prefered type sorting
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
  design: { color: [], typography: [] },  // Containers for holding design elements. Will be overwritten on fetch
  assets: { icons: [], logos: [] },       // Containers for holding assets. Will be overwritten on fetch
  type_copy: 'Almost before we knew it, we had left the ground.', // The sample text to use on the typography page
  color_sort: ['primary', 'secondary', 'extra', 'system'],        // The sort order of the color types
  component_sort: ['primary', 'secondary', 'transparent'],  
};

module.exports = config;
