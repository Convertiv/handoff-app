import { isRendererKind, isSourceFormat, SOURCE_FORMATS, type RendererKind } from './renderers';
import type { CatalogItem, CatalogItemInput, NormalizedImplementation } from './types';

const MISSING_RENDERER_HELP =
  "An implementation needs a renderer. Import defineCatalogItem from 'handoff-app/react' or 'handoff-app/handlebars'.";

/** Handles the shared implementation forms here so renderer entry points only supply types and a renderer. */
const stampImplementation = (implementation: unknown, renderer: RendererKind): NormalizedImplementation => {
  if (typeof implementation === 'string') {
    return { renderer, file: implementation };
  }

  const descriptor = implementation as { format?: unknown; file?: unknown };
  if (descriptor && typeof descriptor === 'object' && typeof descriptor.format === 'string' && typeof descriptor.file === 'string') {
    return { renderer, format: descriptor.format as NormalizedImplementation['format'], file: descriptor.file };
  }

  return { renderer, value: implementation };
};

/** Keeps declarations as plain data that the loader can read without evaluating Handoff. */
export const createCatalogItem = <TArgs = Record<string, unknown>>(
  input: CatalogItemInput,
  renderer?: RendererKind
): CatalogItem<TArgs> => {
  const hasImplementation = input.implementation !== undefined && input.implementation !== null;
  const hasComposition = Array.isArray(input.composition) && input.composition.length > 0;

  if (hasImplementation && hasComposition) {
    throw new Error('A catalog item declares either "implementation" or "composition", not both.');
  }
  if (!hasImplementation && !hasComposition) {
    throw new Error('A catalog item must declare "implementation" or "composition".');
  }

  if (!hasImplementation) {
    validateCatalogItem(input);
    return input as CatalogItem<TArgs>;
  }
  if (!renderer) {
    throw new Error(MISSING_RENDERER_HELP);
  }

  const item = { ...input, implementation: stampImplementation(input.implementation, renderer) };
  validateCatalogItem(item);
  return item as CatalogItem<TArgs>;
};

/** Validate module declarations too, because JavaScript callers have no compile-time checks. */
export function validateCatalogItem(value: unknown): asserts value is CatalogItem {
  const help = ' Use defineCatalogItem. See UPGRADE.md#catalog-items.';
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid catalog item.' + help);
  const item = value as Record<string, any>;
  for (const key of ['previews', 'components', 'renderer', 'sourceFormat', 'should_do', 'should_not_do', 'title']) {
    if (key in item) throw new Error(`Catalog field "${key}" is no longer supported.` + help);
  }
  for (const key of ['component', 'story', 'template']) {
    if (item.entries && key in item.entries) throw new Error(`entries.${key} was removed. Use implementation.` + help);
  }
  if (item.composition !== undefined) {
    if (item.implementation !== undefined || !Array.isArray(item.composition) || !item.composition.length) {
      throw new Error('Declare either an implementation or a non-empty composition.' + help);
    }
    for (const ref of item.composition) {
      if (!ref || typeof ref.ref !== 'string' || !ref.ref.trim() || 'id' in ref) {
        throw new Error('Composition members require "ref", the catalog item id.' + help);
      }
    }
    return;
  }
  const source = item.implementation;
  if (!source || !isRendererKind(source.renderer)) throw new Error('implementation must state a supported renderer.' + help);
  if (
    source.format !== undefined &&
    (!isSourceFormat(source.format) || !SOURCE_FORMATS[source.format].renderers.includes(source.renderer))
  ) {
    throw new Error('implementation.format is not supported by this renderer.' + help);
  }
}
