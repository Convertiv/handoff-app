import React from 'react';
import Cards, { Card } from '../Cards';

export interface CardsSliceProps {
  cards: Card[];
  maxCardsPerRow?: 1 | 2;
}

const CardsSlice: React.FC<CardsSliceProps> = ({ cards, maxCardsPerRow }) => {
  return (
    <div className="mb-5">
      <Cards cards={cards} maxCardsPerRow={maxCardsPerRow} />
    </div>
  );
};

export default CardsSlice;
