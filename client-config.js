module.exports = {
  title: 'Convertiv Design System',
  client: 'Convertiv',
  google_tag_manager: null,
  integration: {
    name: 'bootstrap',
    version: '5.2',
  },
  componentSizeMap: [
    {
      figma: 'small',
      css: 'sm',
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
    components: {
      alert: {
        search: 'Alert',
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
      pagination: {
        search: null,
      },
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
  type_copy: 'Almost before we knew it, we had left the ground.',
  color_sort: ['primary', 'secondary', 'extra', 'system'],
  component_sort: ['primary', 'secondary', 'transparent'],
};
