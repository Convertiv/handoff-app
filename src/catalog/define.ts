import type { RendererKind } from './renderers';
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
    return input as CatalogItem<TArgs>;
  }

  return { ...input, implementation: stampImplementation(input.implementation, renderer) } as CatalogItem<TArgs>;
};

export const isCatalogItem = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return candidate.implementation !== undefined || Array.isArray(candidate.composition);
};

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
