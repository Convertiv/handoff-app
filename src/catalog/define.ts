import type { CatalogItem, CatalogItemInput, CatalogItemMeta, CompositionRef } from './types';

/** Returns the input unchanged, so a declaration is plain data the loader reads without evaluating Handoff. */
export const createCatalogItem = <TArgs = Record<string, unknown>>(input: CatalogItemInput): CatalogItem<TArgs> => {
  const hasImplementation = input.implementation !== undefined && input.implementation !== null;
  const hasComposition = Array.isArray(input.composition) && input.composition.length > 0;

  if (hasImplementation && hasComposition) {
    throw new Error('A catalog item declares either "implementation" or "composition", not both.');
  }
  if (!hasImplementation && !hasComposition) {
    throw new Error('A catalog item must declare "implementation" or "composition".');
  }

  return input as CatalogItem<TArgs>;
};

export const isCatalogItem = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.implementation !== undefined || Array.isArray(candidate.composition);
};

/**
 * Declares a catalog item built from a `composition` of other items, referenced by id. An item with
 * an implementation uses a framework entry point (`handoff-app/react`, `handoff-app/handlebars`).
 */
export const defineCatalogItem = (input: CatalogItemMeta & { composition: CompositionRef[] }): CatalogItem<never> =>
  createCatalogItem<never>(input);
