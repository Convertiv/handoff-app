/**
 * Vue catalog items. The implementation is a Vue 3 single-file component (`.vue`).
 *
 * Preview arguments are the component props, typed from the imported component by `PropsOf`.
 */
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta } from './catalog/types';

/** Vue previews carry data only; they have no `render`. */
export type {
  CatalogItem,
  CatalogItemMeta,
  CompositionRef,
  DataPreview as CatalogPreview,
  DataPreviewOf as Preview,
  SourceDescriptor,
} from './catalog/types';

/**
 * The props a component accepts, as a parent template passes them. Structural, so this module needs
 * no Vue types and works with any Vue 3 version: a `DefineComponent` is a constructor whose instance
 * has `$props`, and a functional component takes its props as the first argument.
 */
type ComponentProps<TComponent> = TComponent extends abstract new (...args: any[]) => { $props: infer TProps }
  ? TProps
  : TComponent extends (props: infer TProps, ...rest: any[]) => unknown
    ? TProps
    : never;

/** Props that Vue adds to every component: `key`, `ref`, `class`, `style`. */
type ReservedProp = 'key' | 'ref' | 'ref_for' | 'ref_key' | 'class' | 'style';

type DeclaredProps<TProps> = {
  // `onClick` or `onUpdate:modelValue` is a listener for an emit, not an argument.
  [TKey in keyof TProps as TKey extends ReservedProp | `on${Capitalize<string>}` ? never : TKey]: TProps[TKey];
};

/**
 * Props of a Vue component, as preview arguments.
 *
 * This is an approximation of what Vue accepts:
 * - It needs the real component type. With a `*.vue` module shim that types every component as
 *   `DefineComponent<{}, {}, any>`, or with plain JavaScript, it falls back to `Record<string, unknown>`.
 *   Volar (`vue-tsc` or the Vue editor extension) gives `.vue` imports their real type.
 * - Props whose name starts with `on` and an upper-case letter are taken as listeners and left out.
 * - A prop with a default is optional, as it is for a parent template.
 */
export type PropsOf<TComponent> = 0 extends 1 & TComponent
  ? Record<string, unknown>
  : 0 extends 1 & ComponentProps<TComponent>
    ? Record<string, unknown>
    : [keyof DeclaredProps<ComponentProps<TComponent>>] extends [never]
      ? Record<string, unknown>
      : DeclaredProps<ComponentProps<TComponent>>;

/**
 * `implementation` accepts an imported component or a file path. Import the component by a relative
 * path, such as `./Button.vue`: the file is resolved from that import, and reading the declaration never
 * runs the component file. The renderer comes from this module, so the build fails an item whose file
 * does not match it. With a file path, type the previews with `defineCatalogItem<Args>`.
 */
export function defineCatalogItem<TComponent extends object>(
  input: CatalogItemMeta & { implementation: TComponent }
): CatalogItem<PropsOf<TComponent>>;
export function defineCatalogItem<TArgs = Record<string, unknown>>(input: CatalogItemMeta & { implementation: string }): CatalogItem<TArgs>;
export function defineCatalogItem(input: CatalogItemMeta & { implementation: unknown }): CatalogItem<any> {
  return createCatalogItem(input, 'vue');
}
