import { defineConfig } from 'handoff-app';

export default defineConfig({
  figmaProjectId: null,
  exportsOutputDirectory: 'exported',
  sitesOutputDirectory: 'out',
  app: {
    theme: 'default',
    title: 'Handoff Design System',
    client: 'Handoff Technologies',
    googleTagManager: null,
    attribution: true,
    typeCopy: 'Almost before we knew it, we had left the ground.',
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
    colorSort: ['primary', 'secondary', 'extra', 'system'],
    componentSort: ['primary', 'secondary', 'transparent'],
    basePath: '',
    breakpoints: {
      mobile: { size: 400, name: 'Mobile' },
      tablet: { size: 800, name: 'Medium' },
      desktop: { size: 1100, name: 'Large' },
    },
    ports: { app: 3000, websocket: 3001 },
  },
  entries: {
    scss: './sass/main.scss',
    js: './js/main.js',
    components: ['./components'],
  },
  assetsZipLinks: {
    icons: null,
    logos: null,
  },
  hooks: {
    cssBuildConfig: (config) => config,
    validateComponent: () => ({}),
    clientBuildConfig: (config) => config,
    htmlBuildConfig: (config) => config,
    jsBuildConfig: (config) => config,
  },
});
