/** @type {import('handoff-app').Component} */
module.exports = {
  id: 'example',
  version: '1.0.0',
  entries: {
    scss: './style.scss',
    template: './template.hbs',
  },
  title: 'Example',
  description: 'An example page for showing how to use the example component.',
  type: 'page',
  group: 'Examples',
  tags: ['errors', 'pages', 'status'],
  should_do: ['Use this to indicate a critical failure', 'or missing content', 'or to show an example'],
  should_not_do: ['Do not use this to communicate information to the customer'],
  properties: {
    title: {
      id: 'title',
      name: 'Title',
      type: 'text',
      default: 'Example',
      rules: { required: true },
    },
    paragraph: {
      id: 'paragraph',
      name: 'Paragraph',
      type: 'text',
      default: 'This is a sample paragraph. You can use this to show an example of a paragraph.',
      rules: { required: false },
    },
    image: {
      id: 'image',
      name: 'Image',
      type: 'image',
      default: {
        src: '/images/content/example.svg',
        alt: 'Microscope',
      },
      rules: { required: true },
    },
    button: {
      id: 'button',
      name: 'Button',
      type: 'button',
      default: {
        label: 'Example',
        url: '#',
      },
      rules: { required: true },
    },
  },
  previews: {
    generic: {
      title: 'Generic',
      values: {
        title: 'Oops, page does not exist.',
        paragraph: 'We can’t find the page you are looking for but don’t worry, there is a lot of useful stuff on our homepage.',

        image: {
          src: '/images/content/microscope.svg',
          alt: 'Microscope',
        },
        button: {
          label: 'Visit home',
          url: '#',
        },
      },
    },
  },
};
