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
declare const Cards: React.FC<CardsProps>;
export default Cards;
