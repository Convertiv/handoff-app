/**
 * Handlebars catalog items.
 *
 * A template carries no type information, so arguments default to `Record<string, unknown>`. Pass
 * an argument type to check previews: `defineCatalogItem<BadgeArgs>`.
 */
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta } from './catalog/types';

export type { CatalogItem, CatalogItemMeta, CatalogPreview, CompositionRef, Preview, SourceDescriptor } from './catalog/types';

/** A React or CSF source has no Handlebars renderer. The message is the type, so the error reads as a sentence. */
type ReactSourceOnHandlebars = "a React or CSF source belongs to 'handoff-app/react', not 'handoff-app/handlebars'";

/** Excluding known React extensions keeps extensionless paths and string variables valid. */
type TemplatePath<TPath extends string> = TPath extends `${string}.stories.${string}` | `${string}.tsx` | `${string}.jsx`
  ? ReactSourceOnHandlebars
  : TPath;

/** Declares a Handlebars catalog item. `implementation` is the path to its `.hbs` template. */
export const defineCatalogItem = <TArgs = Record<string, unknown>, TPath extends string = string>(
  input: CatalogItemMeta & { implementation: TemplatePath<TPath> }
): CatalogItem<TArgs> => createCatalogItem<TArgs>(input, 'handlebars');
