import React from 'react';

type Image = {
  /** The source of the image @required */
  src: string;
  /** The alt text of the image @required */
  alt: string;
};

type CardItem = {
  /** The image of the card @required */
  image: Image;
  /** The title of the card @required */
  title: string;
  /** The description of the card @required */
  description: string;
  /** The link of the card @optional */
  link: { label: string; url: string };
  /** Whether the card is featured @optional */
  featured: boolean;
};

const Card = ({ image, title, description, link, featured }: CardItem) => (
  <article className={`example-csf-card ${featured ? 'is-featured' : ''}`}>
    <img
      src={image?.src}
      alt={image?.alt ?? ''}
      className="example-csf-card__image"
    />
    <h2 className="example-csf-card__title">{title}</h2>
    <p className="example-csf-card__description">{description}</p>
    {link && (
      <a href={link.url} className="example-csf-card__link">
        {link.label}
      </a>
    )}
  </article>
);

const CardRow = ({ cards }: { cards: CardItem[] }) => (
  <div className="example-csf-cards">
    {cards.map((card, i) => (
      <Card key={i} {...card} />
    ))}
  </div>
);

const defaultCards = [
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
];

export default {
  title: 'Examples/Example CSF Cards',
  component: CardRow,
  args: {
    cards: defaultCards,
  },
  argTypes: {
    cards: {
      control: false, description: 'Array of card objects'
    },
  },
};

export const Default = {};

export const CustomCards = {
  args: {
    cards: [
      {
        image: { src: 'https://placehold.co/400x200/dbeafe/1e40af?text=Featured+1', alt: 'Featured 1' },
        title: 'Featured card',
        description: 'This story uses custom card content.',
        link: { label: 'Read more', url: '#' },
        featured: true,
      },
      ...defaultCards.slice(1),
    ],
  },
};
