import type { ComponentInstance } from './define';

/**
 * Shapes shared by the client hooks, the server stores and the HTTP API. Pure types.
 */

/** Points at one stored document version. A tool returns these so open screens refresh. */
export interface DocumentRef {
  collection: string;
  id: string;
  revision: number;
}

export interface DocumentAuthor {
  id: string;
}

/** A document with its storage metadata. `revision` starts at 1 and grows with every write. */
export interface StoredDocument<Doc = unknown> {
  id: string;
  data: Doc;
  revision: number;
  createdAt: string;
  updatedAt: string;
  createdBy: DocumentAuthor | null;
  updatedBy: DocumentAuthor | null;
  ref: DocumentRef;
}

/** Keys that are equality-filterable: top-level fields with a scalar value. */
type ScalarKeys<Doc> = {
  [K in keyof Doc]-?: NonNullable<Doc[K]> extends string | number | boolean ? K : never;
}[keyof Doc];

export type CollectionSort = 'createdAt' | 'updatedAt' | 'id';

/**
 * A collection query. Collections support equality filters on top-level scalar fields, a sort on
 * the storage timestamps or the id, and cursor paging. Anything richer belongs in the core package.
 */
export interface CollectionQuery<Doc = unknown> {
  where?: { [K in ScalarKeys<Doc>]?: Doc[K] };
  /** @default 'createdAt' */
  sort?: CollectionSort;
  /** @default 'asc' */
  order?: 'asc' | 'desc';
  /** @default 50, at most 200 */
  limit?: number;
  /** `nextCursor` of the previous page. */
  cursor?: string;
}

export interface CollectionPage<Doc = unknown> {
  documents: StoredDocument<Doc>[];
  nextCursor: string | null;
}

export type ScreenDataErrorCode = 'not_found' | 'conflict' | 'invalid' | 'forbidden' | 'too_large' | 'unavailable';

/** A collection read or write that failed for a reason the caller can act on. */
export class ScreenDataError extends Error {
  constructor(
    readonly code: ScreenDataErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ScreenDataError';
  }
}

/** A typed store over one collection. Every write is validated against the collection schema. */
export interface CollectionStore<Doc> {
  /** `null` when the document does not exist. An older document is upgraded and written back. */
  get(id: string): Promise<StoredDocument<Doc> | null>;
  list(query?: CollectionQuery<Doc>): Promise<CollectionPage<Doc>>;
  /** Create a document. Omit `id` to get a generated one. Fails with `conflict` when the id is taken. */
  create(data: Doc, options?: { id?: string }): Promise<StoredDocument<Doc>>;
  /**
   * Create or replace a document. With `revision`, the write succeeds only when the stored revision
   * still matches; `revision: 0` means the document must not exist yet.
   */
  put(id: string, data: Doc, options?: { revision?: number }): Promise<StoredDocument<Doc>>;
  /** Read, change and write a document, retrying when another write lands in between. */
  update(id: string, change: (document: Doc) => Doc): Promise<StoredDocument<Doc>>;
  /** `false` when the document did not exist. */
  remove(id: string, options?: { revision?: number }): Promise<boolean>;
}

/** A problem with args against a component's current contract. It never stops a render or a save. */
export interface ArgsIssue {
  code: 'unknown-property' | 'missing-required' | 'type-mismatch';
  path: string;
  message: string;
}

export type ComponentPropertyType = 'text' | 'image' | 'button' | 'array' | 'number' | 'boolean' | 'object' | 'function' | 'enum' | 'any';

/** Limits the design system sets on a property's value. */
export interface ComponentPropertyRules {
  required?: boolean;
  content?: { min: number; max: number };
  dimensions?: {
    width: number;
    height: number;
    min: { width: number; height: number };
    max: { width: number; height: number };
    recommend: { width: number; height: number };
  };
  filesize?: number;
  filetype?: string;
  pattern?: string;
}

/** One property of a component, as the build documents it. */
export interface ComponentProperty {
  id?: string;
  name: string;
  description: string;
  /** The property's type as written in source, such as `'primary' | 'secondary'`. */
  generic: string;
  default?: string | number | boolean | object | unknown[] | null;
  type: ComponentPropertyType;
  /** The item type when `type` is `array`. */
  items?: { type: ComponentPropertyType; properties?: { [key: string]: ComponentProperty } };
  /** The nested properties when `type` is `object`. */
  properties?: { [key: string]: ComponentProperty };
  key?: string;
  rules?: ComponentPropertyRules;
  warnings?: string[];
}

/** A component's properties by name. The args of an instance follow it. */
export type ComponentContract = { [key: string]: ComponentProperty };

export interface ComponentSummary {
  id: string;
  title: string;
  description?: string;
  group?: string;
  /** `element`, `block` or another type the design system uses. */
  type?: string;
  categories?: string[];
  tags?: string[];
  image?: string;
  /** The renderer that builds the component, such as `react` or `handlebars`. */
  renderer?: string;
}

/**
 * A component query. `filter` sets which components a screen offers: write it once, such as in
 * `collections.ts`, and pass it to the UI hook and to `docs.components()` in `tools.ts` alike.
 * `search` then narrows that set.
 */
export interface ComponentQuery {
  /** Case-insensitive text matched against the id, title, description, group, categories and tags. */
  search?: string;
  /** Keep a component when it returns `true`. Groups come from the components it keeps. Define it outside render. */
  filter?(component: ComponentSummary): boolean;
}

/** A pattern query. Same rules as {@link ComponentQuery}; search reads the id, title, description and group. */
export interface PatternQuery {
  search?: string;
  /** Keep a pattern when it returns `true`, such as when every one of its components passes a component filter. */
  filter?(pattern: PatternInfo): boolean;
}

/** A component as screens see it: the contract its args follow and the args a new instance starts with. */
export interface ComponentInfo extends ComponentSummary {
  /** The component's properties. `ArgsForm` builds its fields from it. */
  contract: ComponentContract;
  /** JSON Schema of the args, for an agent or a custom form. */
  argsSchema: Record<string, unknown>;
  /** The first preview's args, plus defaults for required properties. */
  defaultArgs: Record<string, unknown>;
  /** Named previews and their args. */
  previews: { key: string; title: string; args: Record<string, unknown> }[];
  /** Whether the build emitted a client render artifact, which the canvas needs. */
  renderable: boolean;
}

export interface PatternInfo {
  id: string;
  title: string;
  description?: string;
  group?: string;
  /** The pattern's components in order, with their args. Instance ids are created on insert. */
  components: Omit<ComponentInstance, 'id'>[];
}

export interface ArgsAssessment {
  /** The args to render with: the given args plus defaults for missing required properties. */
  args: Record<string, unknown>;
  issues: ArgsIssue[];
}

export interface InstanceAssessment {
  status: 'ok' | 'needs-attention' | 'missing-component';
  issues: ArgsIssue[];
}
