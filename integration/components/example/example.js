/** @type {import('handoff-app').Component} */
module.exports = {
  id: 'example',
  version: '1.0.0',
  entries: {
    scss: './style.scss',
    template: './template.hbs',
  },
  title: 'Example Handlebars',
  description: 'An example row of three cards with image, title, description and link.',
  type: 'page',
  group: 'Examples',
  tags: ['errors', 'pages', 'status'],
  should_do: ['Use this to indicate a critical failure', 'or missing content', 'or to show an example'],
  should_not_do: ['Do not use this to communicate information to the customer'],
  properties: {
    cards: {
      id: 'cards',
      name: 'Cards',
      type: 'array',
      default: [
        {
          image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+1', alt: 'Card 1' },
          title: 'First card',
          description: 'Short description for the first example card in the row.',
          link: { label: 'Learn more', url: '#' },
          featured: false,
        },
      ],
      rules: { required: true },
      items: {
        type: 'object',
        properties: {
          image: {
            type: 'image',
            default: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+1', alt: 'Card 1' },
            rules: {
              required: true,
              dimensions: {
                min: { width: 400, height: 200 }, max: { width: 400, height: 200 }
              }
            },
          },
          title: { type: 'string', description: 'The title of the card', default: 'First card', rules: { required: true, content: { min: 5, max: 100 } } },
          description: { type: 'string', default: 'Short description for the first example card in the row.', rules: { required: true, content: { min: 5, max: 100 } } },
          link: { type: 'link', default: { label: 'Learn more', url: '#' }, rules: { required: true, content: { min: 5, max: 100 } } },
          featured: { type: 'boolean', default: false, rules: { required: false } },
        },
        rules: {
          required: true,
          min: 1,
          max: 10,
        },
      },
    },
  },
  previews: {
    generic: {
      title: 'Generic',
      values: {
        cards: [
          {
            image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+1', alt: 'Card 1' },
            title: 'First card',
            description: 'Short description for the first example card in the row.',
            link: { label: 'Learn more', url: '#' },
          },
          {
            image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+2', alt: 'Card 2' },
            title: 'Second card',
            description: 'Short description for the second example card in the row.',
            link: { label: 'Learn more', url: '#' },
          },
          {
            image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+3', alt: 'Card 3' },
            title: 'Third card',
            description: 'Short description for the third example card in the row.',
            link: { label: 'Learn more', url: '#' },
          },
        ],
      },
    },
    featured: {
      title: 'Featured',
      values: {
        cards: [
          {
            image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+1', alt: 'Card 1' },
            title: 'First card',
            description: 'Short description for the first example card in the row.',
            link: { label: 'Learn more', url: '#' },
            featured: true,
          },
          {
            image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+2', alt: 'Card 2' },
            title: 'Second card',
            description: 'Short description for the second example card in the row.',
            link: { label: 'Learn more', url: '#' },
          },
          {
            image: { src: 'https://placehold.co/400x200/e5e7eb/6b7280?text=Card+3', alt: 'Card 3' },
            title: 'Third card',
            description: 'Short description for the third example card in the row.',
            link: { label: 'Learn more', url: '#' },
          },
        ],
      },
    },
  },
};
