import { PreviewObject } from '@handoff/types';
import React from 'react';
import BestPracticesCard from '../BestPracticesCard';

export interface BestPracticesSliceProps {
  preview: PreviewObject;
  bestPracticesCard?: boolean;
}

const BestPracticesSlice: React.FC<BestPracticesSliceProps> = ({ preview, bestPracticesCard = true }) => {
  return bestPracticesCard ? <BestPracticesCard component={preview} /> : null;
};

export default BestPracticesSlice;
