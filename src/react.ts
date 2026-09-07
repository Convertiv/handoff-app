/** React catalog items, including the CSF source format. */
import type { ComponentType, ReactNode } from 'react';
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta, CsfSource } from './catalog/types';

export type { CatalogItem, CatalogItemMeta, CatalogPreview, CompositionRef, CsfSource, Preview, SourceDescriptor } from './catalog/types';

/** Reads the implementation from a CSF file. That file also defines the previews. */
export const fromCSF = (file: string): CsfSource => ({ format: 'csf', file });

type PropsOf<TComponent> = TComponent extends ComponentType<infer TProps> ? TProps : Record<string, unknown>;

/** Argument metadata for one property, shaped like the Storybook equivalent. */
export type ArgType = {
  name?: string;
  description?: string;
  control?: unknown;
  table?: Record<string, unknown>;
  [key: string]: unknown;
};

/** CSF meta type, so a story file type-checks without a Storybook dependency. */
export type Meta<TComponent = unknown> = {
  title?: string;
  component?: TComponent;
  args?: Partial<PropsOf<TComponent>>;
  argTypes?: Record<string, ArgType>;
  render?: (args: PropsOf<TComponent>) => ReactNode;
};

/** CSF story type, so a story file type-checks without a Storybook dependency. */
export type StoryObj<TMeta = unknown> = TMeta extends { component?: infer TComponent }
  ? {
      name?: string;
      args?: Partial<PropsOf<TComponent>>;
      argTypes?: Record<string, ArgType>;
      render?: (args: PropsOf<TComponent>) => ReactNode;
    }
  : never;

/** A template is not a React source. The message is the type, so the error reads as a sentence. */
type TemplateOnReact = "a .hbs template belongs to 'handoff-app/handlebars', not 'handoff-app/react'";

/**
 * Excluding known template extensions keeps extensionless paths and string variables valid.
 * The build reports mismatches that types cannot catch.
 */
type ReactSourcePath<TPath extends string> = TPath extends `${string}.hbs` ? TemplateOnReact : TPath;

/**
 * `implementation` accepts an imported component, a file path, or `fromCSF(...)`. For an imported
 * component, the file is resolved from the import in this declaration.
 */
export function defineCatalogItem<TProps = Record<string, unknown>, TPath extends string = string>(
  input: CatalogItemMeta & { implementation: ComponentType<TProps> | ReactSourcePath<TPath> }
): CatalogItem<TProps>;
export function defineCatalogItem(input: CatalogItemMeta & { implementation: CsfSource }): CatalogItem<never>;
export function defineCatalogItem(input: CatalogItemMeta & { implementation: unknown }): CatalogItem<any> {
  return createCatalogItem(input, 'react');
}
