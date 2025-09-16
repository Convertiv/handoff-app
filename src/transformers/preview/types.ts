import { Card } from '../../app/components/Component/Cards';
import { ValidationResult } from '../../types';
import { Filter } from '../../utils/filter';
import { SlotMetadata } from './component';

export enum ComponentType {
  Element = 'element',
  Block = 'block',
  Navigation = 'navigation',
  Utility = 'utility',
}

export type PageSliceType = 'BEST_PRACTICES' | 'COMPONENT_DISPLAY' | 'VALIDATION_RESULTS' | 'PROPERTIES' | 'TEXT' | 'CARDS';

export interface BasePageSlice {
  type: PageSliceType;
}

export interface BestPracticesPageSlice extends BasePageSlice {
  type: 'BEST_PRACTICES';
}

export interface ComponentDisplayPageSlice extends BasePageSlice {
  type: 'COMPONENT_DISPLAY';
  showPreview?: boolean;
  showCodeHighlight?: boolean;
  defaultHeight?: string;
  filterBy?: Filter;
}

export interface ValidationResultsPageSlice extends BasePageSlice {
  type: 'VALIDATION_RESULTS';
}

export interface PropertiesPageSlice extends BasePageSlice {
  type: 'PROPERTIES';
}

export interface TextPageSlice extends BasePageSlice {
  type: 'TEXT';
  /** Optional title text (always rendered as H3) */
  title?: string;
  /** Optional HTML content to render */
  content?: string;
}

export interface CardsPageSlice extends BasePageSlice {
  type: 'CARDS';
  /** Array of cards to display */
  cards: Card[];
  /** Maximum number of cards per row (default: 2, max: 2, always full width) */
  maxCardsPerRow?: 1 | 2;
}

/**
 * Discriminated union type for all page slices.
 * Provides type safety by ensuring each slice type has its specific settings.
 * TypeScript will narrow the type based on the 'type' discriminator property.
 */
export type PageSlice =
  | BestPracticesPageSlice
  | ComponentDisplayPageSlice
  | ValidationResultsPageSlice
  | PropertiesPageSlice
  | TextPageSlice
  | CardsPageSlice;

export type ComponentPageDefinition = {
  slices: PageSlice[];
  options?: Record<string, unknown>;
};

export type ComponentListObject = {
  id?: string;
  version: string;
  image: string;
  title: string;
  type: string;
  group: string;
  categories: string[];
  tags: string[];
  description: string;
  figma: string;
  properties: { [key: string]: SlotMetadata };
  versions: string[];
  previews: { [key: string]: OptionalPreviewRender };
  paths: string[];
  entries?: {
    js?: string;
    scss?: string;
    templates?: string;
  };
  options?: {
    preview?: {
      groupBy?: string;
      filterBy?: Filter;
    };
    transformer: {
      cssRootClass?: string;
      tokenNameSegments?: string[];
      defaults: {
        [variantProperty: string]: string;
      };
      replace: { [variantProperty: string]: { [source: string]: string } };
    };
  };
  page?: ComponentPageDefinition;
};

export type TransformComponentTokensResult = {
  id: string;
  source?: 'figma' | 'custom';
  type?: ComponentType;
  image?: string;
  group?: string;
  categories?: string[];
  figma?: string;
  tags?: string[];
  should_do?: string[];
  should_not_do?: string[];
  format: string;
  code: string;
  html?: string;
  preview: string;
  js?: string;
  css?: string;
  sass?: string;
  sharedStyles?: string;
  title?: string;
  description?: string;
  previews?: { [key: string]: OptionalPreviewRender };
  properties?: { [key: string]: SlotMetadata };
  variant?: Record<string, string>;
  entries?: {
    js?: string;
    scss?: string;
    template?: string;
    schema?: string;
  };
  options?: {
    preview?: {
      groupBy?: string;
    };
  };
  validations?: Record<string, ValidationResult>;
  page?: ComponentPageDefinition;
} | null;

export type OptionalPreviewRender = {
  title: string;
  values: { [key: string]: string | string[] | any };
  url: string;
};

export interface TransformedPreviewComponents {
  [key: string]: TransformComponentTokensResult[];
}
