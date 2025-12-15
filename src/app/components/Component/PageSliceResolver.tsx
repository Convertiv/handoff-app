import { PageSlice } from '@handoff/transformers/preview/types';
import { PreviewObject } from '@handoff/types';
import React from 'react';
import { BestPracticesSlice, CardsSlice, ComponentDisplaySlice, PropertiesSlice, TextSlice, ValidationResultsSlice } from './slices';

export interface PageSliceResolverProps {
  slice: PageSlice;
  preview: PreviewObject;
  title: string;
  height?: string;
  currentValues?: Record<string, string>;
  onValuesChange?: (values: Record<string, string>) => void;
  bestPracticesCard?: boolean;
  codeHighlight?: boolean;
  properties?: boolean;
  validations?: boolean;
}

export const PageSliceResolver: React.FC<PageSliceResolverProps> = ({
  slice,
  preview,
  title,
  height,
  currentValues,
  onValuesChange,
  bestPracticesCard = true,
  codeHighlight = true,
  properties = true,
  validations = true,
}) => {
  switch (slice.type) {
    case 'BEST_PRACTICES': {
      return <BestPracticesSlice preview={preview} bestPracticesCard={bestPracticesCard} />;
    }

    case 'COMPONENT_DISPLAY': {
      return (
        <ComponentDisplaySlice
          preview={preview}
          title={title}
          height={height}
          currentValues={currentValues}
          onValuesChange={onValuesChange}
          showPreview={slice.showPreview}
          showCodeHighlight={slice.showCodeHighlight}
          defaultHeight={slice.defaultHeight}
          filterBy={slice.filterBy}
          codeHighlight={codeHighlight}
        />
      );
    }

    case 'VALIDATION_RESULTS': {
      return <ValidationResultsSlice preview={preview} validations={validations} />;
    }

    case 'PROPERTIES': {
      return <PropertiesSlice preview={preview} properties={properties} />;
    }

    case 'TEXT': {
      return <TextSlice title={slice.title} content={slice.content} />;
    }

    case 'CARDS': {
      return <CardsSlice cards={slice.cards} maxCardsPerRow={slice.maxCardsPerRow} />;
    }

    default:
      return null;
  }
};

export default PageSliceResolver;
