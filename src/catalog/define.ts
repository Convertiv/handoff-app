import { isRendererKind, isSourceFormat, SOURCE_FORMATS, type RendererKind } from './renderers';
import type {
  CatalogItem,
  CatalogItemInput,
  CatalogItemMeta,
  CompositionRef,
  ImplementationSource,
  NormalizedImplementation,
} from './types';

/** The literal type gives callers an actionable error for an implementation without a renderer. */
type NeedsStatedRenderer =
  "state the renderer, as implementation: { renderer, file } — or import defineCatalogItem from 'handoff-app/react' or 'handoff-app/handlebars'";

const ROOT_IMPLEMENTATION_HELP =
  `A catalog item declared from 'handoff-app' states its renderer, as implementation: { renderer, file }. ` +
  `Import defineCatalogItem from the renderer's own module to pass a file path or a component directly.`;

/** Handles the shared implementation forms here so renderer entry points only supply types and a renderer. */
const stampImplementation = (implementation: unknown, renderer: RendererKind | undefined): NormalizedImplementation => {
  if (!renderer) {
    const source = implementation as Partial<ImplementationSource>;
    if (!source || typeof source !== 'object' || typeof source.renderer !== 'string' || typeof source.file !== 'string') {
      throw new Error(ROOT_IMPLEMENTATION_HELP);
    }
    return { renderer: source.renderer, format: source.format, file: source.file };
  }

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

/**
 * Declares a catalog item from an implementation that states its renderer, or from a `composition`
 * of other items. A file path or an imported component goes through the renderer's own module
 * (`handoff-app/react`, `handoff-app/handlebars`), and a composition reads better from
 * `handoff-app/pattern`.
 *
 * A file carries no argument type, so pass one to check previews: `defineCatalogItem<BadgeArgs>`.
 */
export function defineCatalogItem<TArgs = Record<string, unknown>>(
  input: CatalogItemMeta &
    (
      | { implementation: ImplementationSource | NeedsStatedRenderer; composition?: never }
      | { composition: CompositionRef[]; implementation?: never }
    )
): CatalogItem<TArgs> {
  return createCatalogItem<TArgs>(input as CatalogItemInput);
}
