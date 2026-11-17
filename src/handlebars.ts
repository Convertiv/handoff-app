/**
 * Handlebars catalog items.
 *
 * A template carries no type information, so arguments default to `Record<string, unknown>`. Pass
 * an argument type to check previews: `defineCatalogItem<BadgeArgs>`.
 */
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta } from './catalog/types';

/** A template renderer never calls a preview `render`, so its previews carry data only. */
export type {
  CatalogItem,
  CatalogItemMeta,
  CompositionRef,
  DataPreview as CatalogPreview,
  DataPreviewOf as Preview,
  SourceDescriptor,
} from './catalog/types';

/**
 * Declares a Handlebars catalog item. `implementation` is the path to its `.hbs` template. The
 * renderer comes from this module, so the build fails an item whose file does not match it.
 */
export const defineCatalogItem = <TArgs = Record<string, unknown>>(
  input: CatalogItemMeta & { implementation: string }
): CatalogItem<TArgs> => createCatalogItem<TArgs>(input, 'handlebars');
