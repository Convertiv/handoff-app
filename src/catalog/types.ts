import type { RendererKind, SourceFormat } from './renderers';
import type { ComponentObject } from '../transformers/preview/types';

/**
 * How an implementation file is written. `fromCSF('./Button.stories.tsx')` is shorthand for
 * `{ format: 'csf', file: './Button.stories.tsx' }`.
 */
export type SourceDescriptor<TFormat extends string = string> = {
  format: TFormat;
  file: string;
};

export type CsfSource = SourceDescriptor<'csf'>;

/** Plain data accepted by the package root and JSON declarations. */
export type ImplementationSource = {
  renderer: RendererKind;
  format?: SourceFormat;
  file: string;
};

/** The loader recovers the file for an imported component in `value` from the declaration source. */
export type NormalizedImplementation = {
  renderer: RendererKind;
  format?: SourceFormat;
  file?: string;
  value?: unknown;
};

export type CatalogItemEntries = NonNullable<ComponentObject['entries']>;

/**
 * Metadata a catalog item can carry. `type` and `categories` are free-form classification, so a
 * term such as atom, element, or block goes there.
 */
export type CatalogItemMeta = Partial<
  Omit<ComponentObject, 'previews' | 'entries' | 'title' | 'should_do' | 'should_not_do' | 'renderer' | 'sourceFormat' | 'componentExport'>
> & {
  id?: string;
  name?: string;
  description?: string;
  group?: string;
  entries?: CatalogItemEntries;
  shouldDo?: string[];
  shouldNotDo?: string[];
};

/** One member of a composition. `ref` is the id of another catalog item. */
export type CompositionRef = {
  ref: string;
  preview?: string;
  args?: Record<string, unknown>;
};

/** A named preview, exported next to the catalog item it belongs to. */
export type CatalogPreview<TArgs = Record<string, unknown>> = {
  /** Display title. Defaults to a start-cased form of the export name. */
  name?: string;
  args?: TArgs;
  usage?: string;
  url?: string;
};

/**
 * `__args` exists only in the type system so `Preview<typeof item>` can infer the preview argument type.
 */
export type CatalogItem<TArgs = Record<string, unknown>> = CatalogItemMeta & {
  implementation?: unknown;
  composition?: CompositionRef[];
  readonly __args?: TArgs;
};

/** Preview type for a catalog item, with its argument type applied. */
export type Preview<TItem> = TItem extends { readonly __args?: infer TArgs } ? CatalogPreview<Partial<NonNullable<TArgs>>> : never;

/** Input accepted by every `defineCatalogItem` entry point. */
export type CatalogItemInput = CatalogItemMeta & {
  implementation?: unknown;
  composition?: CompositionRef[];
};
