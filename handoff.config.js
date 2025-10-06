/** @type {import('handoff-app').Config} */
const path = require('path');
module.exports = {
  figma_project_id: 'nReUH6ZTCsgpWywo63duGm',
  exportsOutputDirectory: 'exported',
  sitesOutputDirectory: 'out',
  app: {
    theme: 'default',
    title: 'Handoff Design System',
    client: 'Handoff Technologies',
    google_tag_manager: null,
    attribution: true,
    type_copy: 'Almost before we knew it, we had left the ground.',
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
    color_sort: ['primary', 'secondary', 'extra', 'system'],
    component_sort: ['primary', 'secondary', 'transparent'],
    base_path: '',
    breakpoints: {
      sm: { size: 576, name: 'Small' },
      md: { size: 768, name: 'Medium' },
      lg: { size: 992, name: 'Large' },
      xl: { size: 1200, name: 'Extra Large' },
    },
  },
  entries: {
    scss: './sass/main.scss',
    js: './js/main.js',
    bundle: './js/main.js',
    components: ['./integration/components'],
  },
  assets_zip_links: {
    icons: null,
    logos: null,
  },
  hooks: {
    cssBuildConfig: async (config) => {
      config.css.preprocessorOptions.scss.silenceDeprecations = [
        'import',
        'legacy-js-api',
        'slash-div',
        'color-functions',
        'global-builtin',
      ];
      let resolve = { alias: {} };
      if (config.resolve?.alias) {
        resolve.alias = config.resolve.alias;
      }
      resolve.alias['@public'] = path.resolve(__dirname, 'public');
      config.resolve = resolve;
      return config;
    },
    validateComponent: async (component) => {},
  },
};
