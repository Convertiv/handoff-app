/**
 * The JSON Schema subset that collections and tool inputs use, and the types derived from it.
 *
 * Pure types and constants: the browser, the server and the build all import this module.
 */

export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'array' | 'object';

/**
 * A JSON Schema written `as const` (or passed straight to a `define*` helper, which infers it as
 * const). Only the keywords in {@link SUPPORTED_SCHEMA_KEYWORDS} are allowed; the build rejects the rest.
 */
export interface JsonSchema {
  readonly type?: JsonSchemaType | readonly JsonSchemaType[];
  readonly properties?: { readonly [key: string]: JsonSchema };
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | JsonSchema;
  readonly items?: JsonSchema;
  readonly enum?: readonly unknown[];
  readonly const?: unknown;
  readonly anyOf?: readonly JsonSchema[];
  readonly oneOf?: readonly JsonSchema[];
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly format?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly multipleOf?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly uniqueItems?: boolean;
  readonly minProperties?: number;
  readonly maxProperties?: number;
  readonly title?: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly examples?: readonly unknown[];
  readonly deprecated?: boolean;
  readonly readOnly?: boolean;
  readonly writeOnly?: boolean;
  readonly $comment?: string;
}

/** An object schema: the root of every collection and tool input. */
export interface JsonObjectSchema extends JsonSchema {
  readonly type: 'object';
}

export const SUPPORTED_SCHEMA_KEYWORDS: readonly string[] = [
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'enum',
  'const',
  'anyOf',
  'oneOf',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
  '$comment',
];

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type FromType<T, S> = T extends 'string'
  ? string
  : T extends 'number' | 'integer'
    ? number
    : T extends 'boolean'
      ? boolean
      : T extends 'null'
        ? null
        : T extends 'array'
          ? S extends { readonly items: infer I }
            ? FromSchema<I>[]
            : unknown[]
          : T extends 'object'
            ? FromObject<S>
            : unknown;

type RequiredKeys<S> = S extends { readonly required: readonly (infer R)[] } ? R : never;

/**
 * Extra keys are typed only when `additionalProperties` allows them. JSON Schema allows them by
 * default, but an open index signature would hide a misspelled field, so a schema opts in.
 */
type ExtraProperties<S> = S extends { readonly additionalProperties: true }
  ? { [key: string]: unknown }
  : S extends { readonly additionalProperties: infer A extends JsonSchema }
    ? { [key: string]: FromSchema<A> }
    : {};

type FromObject<S> = S extends { readonly properties: infer P }
  ? Simplify<
      { -readonly [K in keyof P as K extends RequiredKeys<S> ? K : never]: FromSchema<P[K]> } & {
        -readonly [K in keyof P as K extends RequiredKeys<S> ? never : K]?: FromSchema<P[K]>;
      } & ExtraProperties<S>
    >
  : S extends { readonly additionalProperties: false }
    ? {}
    : S extends { readonly additionalProperties: infer A extends JsonSchema }
      ? { [key: string]: FromSchema<A> }
      : Record<string, unknown>;

/**
 * The TypeScript type of the values a schema accepts. Covers the supported keywords; validation
 * keywords such as `maxLength` do not change the type.
 */
export type FromSchema<S> = S extends { readonly const: infer C }
  ? C
  : S extends { readonly enum: readonly (infer E)[] }
    ? E
    : S extends { readonly anyOf: readonly (infer A)[] }
      ? FromSchema<A>
      : S extends { readonly oneOf: readonly (infer A)[] }
        ? FromSchema<A>
        : S extends { readonly type: readonly (infer T)[] }
          ? FromType<T, S>
          : S extends { readonly type: infer T }
            ? FromType<T, S>
            : unknown;
