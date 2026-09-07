import type React from 'react';
import type { ComponentObject } from '../transformers/preview/types';

export type RendererKind = 'react' | 'handlebars' | 'csf';

/** @deprecated Use `CatalogPreview`, or `Preview<typeof item>` for an inferred argument type. */
export type DeclarationPreview<TArgs = Record<string, any>> = {
  title: string;
  args?: TArgs;
  values?: TArgs;
  url?: string;
  usage?: string;
};

type BaseDeclarationEntries = NonNullable<ComponentObject['entries']> & {
  component?: string;
  story?: string;
  templates?: string;
};

type OptionalComponentMetadata = Partial<Omit<ComponentObject, 'previews' | 'entries' | 'title' | 'should_do' | 'should_not_do'>>;

/** @deprecated Use `CatalogItemMeta` from the catalog API. */
export type BaseDeclarationConfig = OptionalComponentMetadata & {
  id?: string;
  name: string;
  renderer?: RendererKind;
  entries?: BaseDeclarationEntries;
  previews?: Record<string, DeclarationPreview>;
  shouldDo?: string[];
  shouldNotDo?: string[];
};

/** @deprecated Use `defineCatalogItem` from `handoff-app/react`. */
export type ReactDeclarationConfig<TProps> = Omit<BaseDeclarationConfig, 'renderer' | 'entries' | 'previews'> & {
  entries: BaseDeclarationEntries & { component: string };
  previews: Record<string, DeclarationPreview<Partial<TProps>>>;
};

/** @deprecated Use `defineCatalogItem` from `handoff-app/handlebars`. */
export type HandlebarsDeclarationConfig = Omit<BaseDeclarationConfig, 'renderer' | 'entries'> & {
  entries: BaseDeclarationEntries & { template: string };
};

/** @deprecated Use `defineCatalogItem` from `handoff-app/react` with `fromCSF`. */
export type CsfDeclarationConfig = Omit<BaseDeclarationConfig, 'renderer' | 'entries'> & {
  entries: BaseDeclarationEntries & { story: string };
};

/** @deprecated Use `CatalogItem` from the catalog API. */
export type GenericDeclarationConfig = Omit<BaseDeclarationConfig, 'renderer'> & {
  renderer: RendererKind;
};

export type ReactComponentType<TProps = any> = React.ComponentType<TProps>;

// ---------------------------------------------------------------------------
// Pattern declarations
// ---------------------------------------------------------------------------

/** @deprecated Use `CompositionRef` from the catalog API. */
export type PatternComponentRef = {
  id: string;
  preview?: string;
  args?: Record<string, any>;
};

/** @deprecated Use `defineCatalogItem` from `handoff-app` with a `composition` array. */
export type BasePatternDeclarationConfig = {
  id?: string;
  name: string;
  description?: string;
  group?: string;
  tags?: string[];
  components: PatternComponentRef[];
};

/** @deprecated Use `CatalogItem` from the catalog API. */
export type GenericPatternDeclarationConfig = BasePatternDeclarationConfig;
