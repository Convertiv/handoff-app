/**
 * Angular catalog items. The implementation is a standalone component.
 *
 * Preview arguments are the component inputs, typed from the component class by `InputsOf`.
 */
import { createCatalogItem } from './catalog/define';
import type { CatalogItem, CatalogItemMeta } from './catalog/types';

/** Angular previews carry data only; they have no `render`. */
export type {
  CatalogItem,
  CatalogItemMeta,
  CompositionRef,
  DataPreview as CatalogPreview,
  DataPreviewOf as Preview,
  SourceDescriptor,
} from './catalog/types';

/** Structural, so this module needs no Angular types and works with any Angular version. */
type ComponentClass<TComponent> = abstract new (...args: any[]) => TComponent;

/** The reactive node of an `input()` or `model()` signal. Its transform takes the value that the input accepts. */
type InputNode<TWrite> = { transformFn: ((value: TWrite) => unknown) | undefined };

/**
 * The value that a signal input accepts, in a tuple, or `never` for any other value. Angular keys the
 * node by a symbol it does not export, so every key is searched. The tuple keeps a `never` write type
 * apart from "not an input".
 */
type SignalInputWrite<TValue> = TValue extends object
  ? {
      // An `any` member, such as an RxJS `source`, would match any shape.
      [TKey in keyof TValue]-?: 0 extends 1 & TValue[TKey] ? never : TValue[TKey] extends InputNode<infer TWrite> ? [TWrite] : never;
    }[keyof TValue]
  : never;

/**
 * The argument type of one member, or `never` when the member is not an input. A signal input takes
 * its write type, which a transform such as `booleanAttribute` widens. Signals that are not inputs,
 * methods, and outputs (`output()`, `EventEmitter`) drop out. Any other public property stays in,
 * because only the decorator marks an `@Input()` property.
 */
type InputArg<TValue> = [SignalInputWrite<NonNullable<TValue>>] extends [never]
  ? [NonNullable<TValue>] extends [(...args: any[]) => unknown]
    ? never
    : [NonNullable<TValue>] extends [{ subscribe: (...args: any[]) => unknown }]
      ? never
      : TValue
  : SignalInputWrite<NonNullable<TValue>>[0];

/**
 * Inputs of an Angular component, as preview arguments.
 *
 * This is an approximation, because the type of a class does not carry its decorators or input options:
 * - A public property without `@Input()` is an argument too.
 * - An input is keyed by its class property. An aliased input takes its public alias at run time, so
 *   type its previews with `defineCatalogItem<Args>` and a file path implementation instead.
 * - `protected` and `private` members are never arguments.
 */
export type InputsOf<TComponent> = {
  -readonly [TKey in keyof TComponent as [InputArg<TComponent[TKey]>] extends [never] ? never : TKey]: InputArg<TComponent[TKey]>;
};

/**
 * `implementation` accepts an imported component class or a file path. For an imported class, the
 * file is resolved from the import in this declaration, and reading the declaration never runs the
 * component file. The renderer comes from this module, so the build fails an item whose file does
 * not match it.
 */
export function defineCatalogItem<TComponent>(
  input: CatalogItemMeta & { implementation: ComponentClass<TComponent> }
): CatalogItem<InputsOf<TComponent>>;
export function defineCatalogItem<TArgs = Record<string, unknown>>(input: CatalogItemMeta & { implementation: string }): CatalogItem<TArgs>;
export function defineCatalogItem(input: CatalogItemMeta & { implementation: unknown }): CatalogItem<any> {
  return createCatalogItem(input, 'angular');
}
