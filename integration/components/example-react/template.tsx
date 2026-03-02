import React from 'react';

type Image = {
  src: string;
  alt: string;
};

type CardItem = {
  /** The image of the card @default 'https://via.placeholder.com/150' @required */
  image: Image;
  /** The title of the card @default 'First card' @required */
  title: string;
  /** The description of the card @default 'Short description for the first example card in the row.' @required */
  description: string;
  /** The link of the card @default { label: 'Learn more', url: '#' } @optional */
  link: { label: string; url: string };
  /** Whether the card is featured @default false @optional */
  featured: boolean;
};

type Props = {
  /** The cards to display @default [] @optional */
  cards: CardItem[];
};

const ExampleReactTemplate: React.FC<Props> = ({ cards }) => {
  return (
    <div className="example-react-cards">
      {cards.map((card, i) => (
        <article key={i} className={`example-react-card ${card.featured ? 'is-featured' : ''}`}>
          <img
            src={card.image.src}
            alt={card.image.alt}
            className="example-react-card__image"
          />
          <h2 className="example-react-card__title">{card.title}</h2>
          <p className="example-react-card__description">{card.description}</p>
          {card.link && (
            <a href={card.link.url} className="example-react-card__link">
              {card.link.label}
            </a>
          )}
        </article>
      ))}
    </div>
  );
};

export default ExampleReactTemplate;
