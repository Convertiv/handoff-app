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

export type ComponentOptions = {
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

/**
 * Represents a full component definition with metadata, property schema, preview definitions, and other optional configuration.
 */
export type ComponentObject = {
  /** Human-friendly name for this component (e.g. "Button") */
  title: string;
  /** Short description of the component, shown in lists or documentation */
  description: string;
  /** Preview image URL or file path for the component's main preview */
  image: string;
  /** Group or category under which this component falls (e.g. "Inputs", "Atoms") */
  group: string;
  /** String identifier for the component type (e.g. "element", "compound") */
  type: string;
  /** Optional file entry references for the component's implementation */
  entries?: {
    /** Optional path to the main JS module (if available) */
    js?: string;
    /** Optional path to the main SCSS/CSS file (if available) */
    scss?: string;
    /** Optional path to component template file (if available) */
    template?: string;
  };
  /** Schema describing the expected properties (props/slots) for the component */
  properties: { [key: string]: SlotMetadata };
  /** Mapping of preview variations with values and titles for each (used to render sample states) */
  previews: { [key: string]: OptionalPreviewRender };
  /** Optional array of high-level categories for search/filtering */
  categories?: string[];
  /** Optional array of tags for search/filtering (e.g. "primary", "interactive") */
  tags?: string[];
  /** Optional source Figma file or node URL for the component */
  figma?: string;
  /** Optional canonical Figma component name or ID (used for matching back to design tokens) */
  figmaComponentId?: string;
  /** Optional page definition containing slices for the documentation site */
  page?: ComponentPageDefinition;
  /** Optional additional options for preview and transformer behaviors */
  options?: ComponentOptions;
}

export type ComponentListObject = {
  id: string;
  version: string;
  versions: string[];
  paths: string[];
} & ComponentObject;

export type TransformComponentTokensResult = {
  id: string;
  type?: ComponentType;
  image?: string;
  group?: string;
  categories?: string[];
  figma?: string;
  figmaComponentId?: string;
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
