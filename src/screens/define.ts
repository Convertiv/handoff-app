import type { ComponentType } from 'react';
import type { FromSchema, JsonObjectSchema } from './schema';

/**
 * Definitions shared by the screen UI, the server and the build. Pure: no React runtime, no Node.
 */

/** Who may use a screen in a registry. A workspace has one user and applies no roles. */
export type ScreenRole = 'member' | 'admin';

export interface ScreenAccess {
  /** Role needed to open the screen and read its collections. @default 'member' */
  read?: ScreenRole;
  /** Role needed to write its collections. @default 'member' */
  write?: ScreenRole;
}

/** Where a tool is offered. `screen`: only to the assistant on that screen. `global`: everywhere, external MCP clients included. */
export type ToolScope = 'screen' | 'global';

export interface CollectionMcpOptions {
  /** @default 'screen' */
  scope?: ToolScope;
  /** Offer only the list and get tools. @default false */
  readOnly?: boolean;
}

/** Upgrade steps keyed by the version they produce: `{ 2: (v1) => v2 }`. */
export type CollectionMigrations = { readonly [version: number]: (document: any) => unknown };

export interface CollectionOptions<S extends JsonObjectSchema, Name extends string> {
  /** Unique within the screen. Lowercase letters, digits, `-` and `_`, starting with a letter. */
  name: Name;
  /** Schema version of the stored documents. Bump it with a `migrate` step when `schema` changes. @default 1 */
  version?: number;
  /** JSON Schema of one document. The server validates every write against it. */
  schema: S;
  /** Upgrades older documents when they are read. The upgraded document is written back. */
  migrate?: CollectionMigrations;
  /** Generate assistant tools for this collection: `<screen>_<collection>_list|get|create|update|delete`. @default false */
  mcp?: boolean | CollectionMcpOptions;
}

/** A collection of JSON documents that a screen owns. Create it with {@link defineCollection}. */
export interface Collection<Doc = unknown, Name extends string = string> {
  readonly kind: 'handoff-collection';
  readonly name: Name;
  readonly version: number;
  readonly schema: JsonObjectSchema;
  readonly migrate?: CollectionMigrations;
  readonly mcp: false | Required<CollectionMcpOptions>;
  /** Carries the document type. Never set at runtime. */
  readonly __document?: Doc;
}

/** The document type of a collection: `type Note = DocumentOf<typeof notes>`. */
export type DocumentOf<C> = C extends Collection<infer Doc, string> ? Doc : never;

/** Any collection, for APIs that accept every collection. */
export type AnyCollection = Collection<any, string>;

const NAME_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/;

/**
 * Declare a collection. The document type comes from `schema`, so write the schema inline or
 * `as const`.
 *
 * @example
 * export const notes = defineCollection({
 *   name: 'notes',
 *   schema: { type: 'object', required: ['title'], properties: { title: { type: 'string' } }, additionalProperties: false },
 * });
 */
export const defineCollection = <const S extends JsonObjectSchema, const Name extends string>(
  options: CollectionOptions<S, Name>
): Collection<FromSchema<S>, Name> => {
  if (!options || typeof options !== 'object') throw new Error('defineCollection() needs an options object.');
  if (!NAME_PATTERN.test(options.name ?? '')) {
    throw new Error(`Collection name "${options.name}" is invalid. Use lowercase letters, digits, "-" and "_", starting with a letter.`);
  }
  const version = options.version ?? 1;
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Collection "${options.name}" has version ${String(options.version)}. Use a whole number of 1 or more.`);
  }
  const mcp = options.mcp === true ? {} : options.mcp || null;
  return {
    kind: 'handoff-collection',
    name: options.name,
    version,
    schema: options.schema,
    migrate: options.migrate,
    mcp: mcp ? { scope: mcp.scope ?? 'screen', readOnly: mcp.readOnly ?? false } : false,
  };
};

export const isCollection = (value: unknown): value is AnyCollection =>
  typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === 'handoff-collection';

/** One placed component: its id in the list, the component it renders, and the args it renders with. */
export interface ComponentInstance {
  id: string;
  componentId: string;
  args: Record<string, unknown>;
}

export interface ScreenNavOptions {
  /** Order in the screens list; lower comes first. @default 0 */
  weight?: number;
  /** Leave the screen out of the nav and the screens list. It stays reachable by URL. @default false */
  hidden?: boolean;
}

/**
 * The build reads `title`, `description`, `icon`, `nav`, `access` and `fullscreen` from the source,
 * so write them as literals.
 */
export interface ScreenOptions {
  title: string;
  description?: string;
  /** A Lucide icon name in kebab case, such as `notebook-pen`. */
  icon?: string;
  nav?: ScreenNavOptions;
  access?: ScreenAccess;
  /**
   * Show the screen without the docs header. `true` applies to every path of the screen. A list
   * applies to the paths it matches: each pattern lists the path segments after `/screens/<id>/`,
   * and `*` matches any one segment. `['*\/view']` matches `/screens/<id>/<doc>/view`, and
   * `''` matches the screen root. @default false
   */
  fullscreen?: boolean | string[];
  /** The screen's view. It reads everything it needs through the `handoff-app/screens` hooks. */
  component: ComponentType;
}

export interface ScreenDefinition extends Omit<ScreenOptions, 'component'> {
  readonly kind: 'handoff-screen';
  component: ComponentType;
}

/** Declare a screen. Export the result as the default export of the screen's `index.tsx`. */
export const defineScreen = (options: ScreenOptions): ScreenDefinition => ({ ...options, kind: 'handoff-screen' });
