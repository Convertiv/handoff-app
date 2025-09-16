import React from 'react';

/**
 * Card interface for the Cards component
 */
export interface Card {
  /** Title of the card */
  title: string;
  /** Content of the card (supports multi-line with \n separators) */
  content: string;
  /** (Optional) Visual type of the card affecting icon and colors */
  type?: 'positive' | 'negative';
}

/**
 * Props for the Cards component
 */
export interface CardsProps {
  /** Array of cards to display */
  cards: Card[];
  /** Maximum number of cards per row (1-2, default: 2) */
  maxCardsPerRow?: 1 | 2;
  /** Additional CSS classes */
  className?: string;
}

const CardIcon: React.FC<{ type: Card['type'] }> = ({ type }) => {
  switch (type) {
    case 'positive':
      return (
        <svg
          className="mt-[5px] h-3 w-3 flex-shrink-0 text-emerald-600"
          strokeWidth={3}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'negative':
      return (
        <svg className="mt-[5px] h-3 w-3 flex-shrink-0 text-gray-400" strokeWidth={3} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    default:
      return <></>;
  }
};

const CardItem: React.FC<{ card: Card }> = ({ card }) => {
  // Split content by newlines and render each line as a separate item
  const lines = card.content.split('\n').filter((line) => line.trim());

  return (
    <ul className="space-y-3">
      {lines.map((line, index) => (
        <li key={index} className="flex items-start gap-3">
          <CardIcon type={card.type} />
          <p className="text-sm">{line}</p>
        </li>
      ))}
    </ul>
  );
};

const Cards: React.FC<CardsProps> = ({ cards, maxCardsPerRow = 2, className = '' }) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  // Calculate grid columns based on maxCardsPerRow (always full width, max 2 per row)
  const getGridCols = () => {
    if (maxCardsPerRow === 1) return 'grid-cols-1';
    if (maxCardsPerRow === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (maxCardsPerRow === 3) return 'grid-cols-1 sm:grid-cols-2'; // Cap at 2 per row
    return 'grid-cols-1 sm:grid-cols-2'; // Default to max 2 per row
  };

  return (
    <div className={`flex flex-col gap-2 pb-7 ${className}`}>
      <div className={`grid gap-6 ${getGridCols()}`}>
        {cards.map((card, index) => (
          <div
            key={`card-${index}`}
            className={`relative rounded-lg border p-8 ${
              card.type === 'positive'
                ? 'bg-gray-50 text-gray-600 dark:bg-gray-800'
                : card.type === 'negative'
                  ? 'bg-gray-50 text-gray-600 dark:bg-gray-800'
                  : 'bg-gray-50 text-gray-600 dark:bg-gray-800'
            }`}
          >
            <h2
              className={`mb-3 font-normal ${
                card.type === 'positive' ? 'text-gray-700' : card.type === 'negative' ? 'text-gray-900' : 'text-gray-800'
              }`}
            >
              {card.title}
            </h2>
            <div
              className={`${card.type === 'positive' ? 'text-emerald-800' : card.type === 'negative' ? 'text-red-800' : 'text-blue-800'}`}
            >
              <CardItem card={card} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
