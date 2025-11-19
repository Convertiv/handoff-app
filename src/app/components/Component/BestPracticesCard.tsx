import { PreviewObject } from '@handoff/types';
import React from 'react';
import Cards, { Card } from './Cards';

const BestPracticesCard: React.FC<{ component: PreviewObject }> = ({ component }) => {
  const cards: Card[] = [];

  // Add best practices card if available
  if (component.should_do && component.should_do.length > 0) {
    cards.push({
      title: 'Best Practices',
      content: component.should_do.join('\n'),
      type: 'positive'
    });
  }

  // Add common mistakes card if available
  if (component.should_not_do && component.should_not_do.length > 0) {
    cards.push({
      title: 'Common Mistakes',
      content: component.should_not_do.join('\n'),
      type: 'negative'
    });
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <div id="best-practices">
      <Cards cards={cards} />
    </div>
  );
};
export default BestPracticesCard;
