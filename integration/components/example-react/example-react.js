/** @type {import('handoff-app').Component} */
module.exports = {
  id: 'example-react',
  version: '1.0.0',
  entries: {
    scss: './style.scss',
    template: './template.tsx',
  },
  title: 'Example React TSX',
  description: 'Example TSX component: a row of three cards with image, title, description and link.',
  type: 'element',
  group: 'Examples',
  tags: ['react', 'tsx'],
  should_do: ['Use this as a reference for TSX entry templates'],
  should_not_do: ['Do not use this as production UI'],
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
