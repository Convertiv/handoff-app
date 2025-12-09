import { Check, X } from 'lucide-react';
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

const PracticeLine: React.FC<{ line: string; type?: Card['type'] }> = ({ line, type }) => (
  <li className="flex items-start gap-3">
    {type === 'positive' ? (
      <Check className="mt-[5px] h-3 w-3 shrink-0 text-emerald-600" strokeWidth={3} />
    ) : type === 'negative' ? (
      <X className="mt-[5px] h-3 w-3 shrink-0 text-gray-400" strokeWidth={3} />
    ) : (
      <span className="mt-[5px] h-3 w-3 shrink-0" />
    )}
    <p className="text-sm">{line}</p>
  </li>
);

const CardItem: React.FC<{ card: Card }> = ({ card }) => {
  // Split content by newlines and render each line as a separate item
  const lines = card.content.split('\n').filter((line) => line.trim());

  return (
    <ul className="space-y-3 text-emerald-800">
      {lines.map((line, index) => (
        <PracticeLine line={line} type={card.type} key={`do-rule-${index}`} />
      ))}
    </ul>
  );
};

const Cards: React.FC<CardsProps> = ({ cards, maxCardsPerRow = 2, className = '' }) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
      {cards.map((card, index) => (
        <div
          key={`card-${index}`}
          className="relative rounded-lg border bg-gray-50 p-8 text-gray-600 dark:bg-gray-800"
        >
          <h2 className="mb-3 font-normal text-gray-700">
            {card.title}
          </h2>
          <CardItem card={card} />
        </div>
      ))}
    </div>
  );
};

export default Cards;
