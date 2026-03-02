/** @type {import('handoff-app').Component} */
module.exports = {
  id: 'example-csf',
  version: '1.0.0',
  entries: {
    scss: './style.scss',
    template: './template.stories.tsx',
  },
  title: 'Example CSF',
  description: 'Example component powered by Storybook CSF format.',
  type: 'element',
  group: 'Examples',
  tags: ['storybook', 'csf'],
  should_do: ['Use this as a reference for CSF component previews'],
  should_not_do: ['Do not use this as production UI'],
};
