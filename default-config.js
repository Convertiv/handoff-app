module.exports = {
  title: 'Convertiv Design System',
  client: 'Convertiv',
  google_tag_manager: null,
  integration: {
    name: 'bootstrap',
    version: '5.2',
  },
  favicon: '/favicon.ico',
  logo: '/logo.svg',
  poweredBy: true,
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
  figma: {
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
  type_copy: 'Almost before we knew it, we had left the ground.',
  color_sort: ['primary', 'secondary', 'extra', 'system'],
  component_sort: ['primary', 'secondary', 'transparent'],
};
