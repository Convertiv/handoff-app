/**
 * Composition catalog items.
 *
 * A composition renders by referencing other items, so it declares no implementation and owns no
 * previews — `CatalogPreview` and `Preview` are deliberately not re-exported here.
 */
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta, CompositionRef } from './catalog/types';

export type { CatalogItem, CatalogItemMeta, CompositionRef } from './catalog/types';

/** Declares a catalog item built from a `composition` of other items, referenced by id. */
export const defineCatalogItem = (input: CatalogItemMeta & { composition: CompositionRef[]; implementation?: never }): CatalogItem<never> =>
  createCatalogItem<never>(input);
