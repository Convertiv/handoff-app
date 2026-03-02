/** @type {import('handoff-app').Component} */
module.exports = {
  id: 'example-react',
  version: '1.0.0',
  entries: {
    scss: './style.scss',
    template: './template.tsx',
  },
  title: 'Example React TSX',
  description: 'Example TSX component preview.',
  type: 'element',
  group: 'Examples',
  tags: ['react', 'tsx'],
  should_do: ['Use this as a reference for TSX entry templates'],
  should_not_do: ['Do not use this as production UI'],
  previews: {
    generic: {
      title: 'Generic',
      values: {
        title: 'TSX Component',
        body: 'This component is rendered from template.tsx',
        featured: false,
      },
    },
    featured: {
      title: 'Featured',
      values: {
        title: 'Featured example',
        body: 'This is the featured variant with emphasis styling.',
        featured: true,
      },
    },
  },
};
