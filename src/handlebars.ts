/**
 * Handlebars catalog items.
 *
 * A template carries no type information, so arguments default to `Record<string, unknown>`. Pass
 * an argument type to check previews: `defineCatalogItem<BadgeArgs>`.
 */
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta, CatalogPreview as RendererPreview } from './catalog/types';

export type { CatalogItem, CatalogItemMeta, CompositionRef, SourceDescriptor } from './catalog/types';

/** A template renderer never calls a preview `render`, so declaring one is an error, not a no-op. */
export type CatalogPreview<TArgs = Record<string, unknown>> = Omit<RendererPreview<TArgs>, 'render'> & { render?: never };

/** Preview type for a Handlebars catalog item, with its argument type applied. */
export type Preview<TItem> = TItem extends { readonly __args?: infer TArgs } ? CatalogPreview<Partial<NonNullable<TArgs>>> : never;

/**
 * Declares a Handlebars catalog item. `implementation` is the path to its `.hbs` template. The
 * renderer comes from this module, so the build fails an item whose file does not match it.
 */
export const defineCatalogItem = <TArgs = Record<string, unknown>>(
  input: CatalogItemMeta & { implementation: string }
): CatalogItem<TArgs> => createCatalogItem<TArgs>(input, 'handlebars');
