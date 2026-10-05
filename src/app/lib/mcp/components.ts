import { buildArtifactUrl } from '@handoff/artifacts/url';
import type { SlotMetadata } from '@handoff/transformers/preview/component';
import type { ComponentListObject, OptionalPreviewRender, TransformComponentTokensResult } from '@handoff/transformers/preview/types';
import type { DocsBackend } from '../docs-api/backend';
import { basePath, fail, ok, read } from './result';
import { defineTool, type McpTool } from './tool';

/** The component tools: search, read, one preview, and the source. */

/** Search results are capped so a large design system cannot flood an agent's context. */
const DEFAULT_SEARCH_LIMIT = 25;
const MAX_SEARCH_LIMIT = 100;

/** The source fields handoff_get_component_source returns; the build artifact carries them under these names. */
const SOURCE_FIELDS = ['code', 'css', 'sass', 'js'] as const;
type SourceField = (typeof SOURCE_FIELDS)[number];

const componentId = { type: 'string', description: 'Component id, as returned by handoff_search_components.' };

export const componentTools: McpTool[] = [
  defineTool<{ query?: string; group?: string; category?: string; tag?: string; limit?: number }>(
    {
      name: 'handoff_search_components',
      title: 'Search components',
      description:
        'Find components. `query` matches id, title, group, categories and tags. With no arguments, ' +
        'lists all components. Each result has id, title, description, group, type, categories and ' +
        'tags. Read one component with handoff_get_component.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Text to find. Case-insensitive substring match.' },
          group: { type: 'string', description: 'Group name, for example "Form Elements". Exact match, case-insensitive.' },
          category: { type: 'string', description: 'Category name. Exact match, case-insensitive.' },
          tag: { type: 'string', description: 'Tag name. Exact match, case-insensitive.' },
          limit: { type: 'integer', minimum: 1, maximum: MAX_SEARCH_LIMIT, description: `Max results (default ${DEFAULT_SEARCH_LIMIT}).` },
        },
      },
    },
    async ({ query, group, category, tag, limit }) =>
      read('the component catalog', async (backend) => {
        const matched = (await backend.listComponents()).filter((record: ComponentListObject) =>
          matchesComponent(record, { query, group, category, tag })
        );
        const components = matched.slice(0, limit ?? DEFAULT_SEARCH_LIMIT).map(toComponentSummary);
        return ok({ total: matched.length, returned: components.length, components });
      })
  ),

  defineTool<{ id: string }>(
    {
      name: 'handoff_get_component',
      title: 'Get component',
      description:
        'One component: properties, variants, usage and guidelines. `usage` is the snippet of the first ' +
        'preview. When `usage` is absent, as for handlebars components, read the template with ' +
        'handoff_get_component_source. `variants` lists the values the previews show; ' +
        '`properties[].type` has all allowed values. To see another state, pass a `previews[].id` to ' +
        'handoff_get_component_preview. `tokens.set`, when present, is the id to pass to ' +
        'handoff_get_tokens. Do not derive a token set id from the component id.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: { type: 'object', properties: { id: componentId }, required: ['id'] },
    },
    async ({ id }) =>
      read(`component "${id}"`, async (backend) => {
        const record = await backend.getComponentDetail(id);
        if (!record) {
          return componentNotFound(id);
        }
        const [artifact, tokenSets] = await Promise.all([readComponentArtifact(backend, id), backend.listTokenSets()]);
        return ok(
          toComponentResult(
            record,
            artifact,
            basePath(),
            tokenSets.map((set) => set.id)
          )
        );
      })
  ),

  defineTool<{ id: string; preview: string }>(
    {
      name: 'handoff_get_component_preview',
      title: 'Get component preview',
      description:
        'One state of a component: `values` (the args), `usage` (the snippet) and `html` (the rendered ' +
        'markup). `html` is absent when the component is not built.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          id: componentId,
          preview: { type: 'string', description: 'Preview id, as listed in `previews[].id` by handoff_get_component.' },
        },
        required: ['id', 'preview'],
      },
    },
    async ({ id, preview }) =>
      read(`preview "${preview}" of component "${id}"`, async (backend) => {
        const record = await backend.getComponentDetail(id);
        if (!record) {
          return componentNotFound(id);
        }
        const artifact = await readComponentArtifact(backend, id);
        const previews = artifact?.previews ?? record.previews ?? {};
        const found = previews[preview];
        if (!found) {
          const ids = Object.keys(previews);
          return fail(
            `Component "${id}" has no preview "${preview}". ${ids.length ? `Its previews are: ${ids.join(', ')}.` : 'It has no previews.'}`
          );
        }
        return ok(toPreviewResult(record, preview, found, basePath(), await readPreviewDocument(backend, id, preview)));
      })
  ),

  defineTool<{ id: string }>(
    {
      name: 'handoff_get_component_source',
      title: 'Get component source',
      description:
        'The implementation of a component: `code` (the component or template) and, when present, ' +
        '`css`, `sass` and `js`. Use it only when handoff_get_component is not enough. The source ' +
        'fields are absent when the component is not built.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: { type: 'object', properties: { id: componentId }, required: ['id'] },
    },
    async ({ id }) =>
      read(`source of component "${id}"`, async (backend) => {
        const record = await backend.getComponentDetail(id);
        if (!record) {
          return componentNotFound(id);
        }
        return ok(toComponentSource(record, await readComponentArtifact(backend, id)));
      })
  ),
];

const componentNotFound = (id: string) =>
  fail(`Component "${id}" was not found. Use handoff_search_components to list the components that exist.`);

/** One preview's rendered document, or `undefined` when the component has not been built. */
const readPreviewDocument = async (backend: DocsBackend, id: string, previewId: string): Promise<string | undefined> => {
  const artifact = await backend.resolveArtifact(['component', `${id}-${previewId}.html`]);
  return artifact?.body.toString() || undefined;
};

/** Read and parse a component's build artifact, or `null` when the component has not been built. */
const readComponentArtifact = async (backend: DocsBackend, id: string): Promise<TransformComponentTokensResult | null> => {
  const artifact = await backend.resolveArtifact(['component', `${id}.json`]);
  if (!artifact) {
    return null;
  }
  try {
    return JSON.parse(artifact.body.toString()) as TransformComponentTokensResult;
  } catch {
    // A corrupt artifact should not sink the metadata the agent can still use.
    return null;
  }
};

/**
 * One row of a component search result: identity and classification, and nothing else.
 *
 * Search answers "which component do I want", so a row carries only what tells one component from
 * another. Previews, properties and usage belong to handoff_get_component.
 */
export interface ComponentSummary {
  id: string;
  title: string;
  description?: string;
  group?: string;
  type?: string;
  categories?: string[];
  tags?: string[];
}

const nonEmpty = (values: string[] | undefined): string[] | undefined => (values?.length ? values : undefined);

export const toComponentSummary = (record: ComponentListObject): ComponentSummary => ({
  id: record.id,
  title: record.title,
  description: record.description || undefined,
  group: record.group || undefined,
  type: record.type || undefined,
  categories: nonEmpty(record.categories),
  tags: nonEmpty(record.tags),
});

/** Case-insensitive substring test that treats a missing haystack as no match. */
const contains = (haystack: string | undefined, needle: string): boolean => (haystack ?? '').toLowerCase().includes(needle);

/** Case-insensitive equality, used by the `group`/`category`/`tag` filters. */
const equals = (value: string | undefined, other: string): boolean => (value ?? '').toLowerCase() === other;

export interface ComponentSearchFilters {
  query?: string;
  group?: string;
  category?: string;
  tag?: string;
}

/**
 * Whether a record satisfies every supplied filter. `query` is a substring across id, title, group,
 * categories and tags; the others are exact case-insensitive matches, so an agent can pivot straight
 * off a value it just read out of a search result.
 */
export const matchesComponent = (record: ComponentListObject, filters: ComponentSearchFilters): boolean => {
  const query = filters.query?.trim().toLowerCase();
  const group = filters.group?.trim().toLowerCase();
  const category = filters.category?.trim().toLowerCase();
  const tag = filters.tag?.trim().toLowerCase();

  if (query) {
    const hit =
      contains(record.id, query) ||
      contains(record.title, query) ||
      contains(record.group, query) ||
      (record.categories ?? []).some((value) => contains(value, query)) ||
      (record.tags ?? []).some((value) => contains(value, query));
    if (!hit) return false;
  }
  if (group && !equals(record.group, group)) return false;
  if (category && !(record.categories ?? []).some((value) => equals(value, category))) return false;
  if (tag && !(record.tags ?? []).some((value) => equals(value, tag))) return false;
  return true;
};

/** A component property as an agent needs it: what to pass, of what type, and whether it is required. */
export interface ComponentProperty {
  name: string;
  description?: string;
  /** The prop's type: its real signature when docgen resolved one, else the coarse slot type. */
  type: string;
  default?: unknown;
  required?: boolean;
  /** Element type, for an array property. */
  items?: string;
  /** Nested shape, for an object or array-of-object property. */
  properties?: Record<string, ComponentProperty>;
}

/**
 * Flatten one `SlotMetadata`.
 *
 * `type` prefers `docgenType` because `SlotType` mostly falls back to `text` once docgen has run: it
 * reports a boolean prop, an enum and an array alike, which is enough to make an agent pass the
 * wrong thing. `docgenType` is the real signature (`boolean | undefined`, `"sm" | "lg" | undefined`,
 * `SelectOption[]`), and it covers values no preview happens to demonstrate. `SlotType` is the
 * fallback for a component with no docgen, such as handlebars or CSF.
 *
 * The rest of the docgen output is dropped: `deepType` is a whole type AST, and `typeRefs`,
 * `annotations` and `warnings` give an agent nothing to act on.
 */
export const toProperty = (key: string, slot: SlotMetadata): ComponentProperty => ({
  name: slot.name || key,
  description: slot.description || undefined,
  type: slot.docgenType || slot.type,
  default: slot.default ?? undefined,
  required: slot.rules?.required || undefined,
  items: slot.items?.type,
  properties: toProperties(slot.properties ?? slot.items?.properties),
});

export const toProperties = (slots: { [key: string]: SlotMetadata } | undefined): Record<string, ComponentProperty> | undefined => {
  if (!slots || Object.keys(slots).length === 0) return undefined;
  return Object.fromEntries(Object.entries(slots).map(([key, slot]) => [key, toProperty(key, slot)]));
};

/**
 * One row of a component's preview index: enough to choose a preview, and nothing else.
 *
 * What a preview demonstrates and what it renders to are the bulk of a component record and are
 * wanted one at a time, so they live behind handoff_get_component_preview. `variants` already names
 * the axes these previews cover.
 */
export interface ComponentPreviewSummary {
  id: string;
  title: string;
  /** Canonical URL of the rendered preview artifact. */
  url: string;
}

/** One preview in full: the args it passes, its usage snippet and the markup it renders to. */
export interface ComponentPreviewResult extends ComponentPreviewSummary {
  /** The component it belongs to, so the caller can link to it without a second call. */
  component: { id: string; title: string };
  values: Record<string, unknown>;
  usage?: string;
  /** Markup this preview renders to. Absent when the component has not been built. */
  html?: string;
}

/**
 * The rendered markup inside a preview document's `<body>`.
 *
 * An emitted preview is a whole HTML page: doctype, stylesheet links, the hydration script. None of
 * that is the component, and all of it is noise in an agent's context. `trimPreview` narrows the
 * same way, but its parser lives in a module that also pulls in prettier. These documents are
 * generator-written with exactly one `<body>`, so a pattern is enough here.
 */
const previewBody = (document: string): string => {
  const match = /<body[^>]*>([\s\S]*)<\/body>/i.exec(document);
  return (match ? match[1] : document).trim();
};

/**
 * The URL a preview's rendered artifact is served at. The builder writes the record's own `url`
 * empty, so it is derived here the way the docs UI does.
 */
const previewUrl = (id: string, previewId: string, basePath: string): string =>
  buildArtifactUrl(`component/${id}-${previewId}.html`, basePath);

/** The component's previews as an index: which ones exist, and where each is rendered. */
export const toPreviewIndex = (
  id: string,
  previews: { [key: string]: OptionalPreviewRender } | undefined,
  basePath: string
): ComponentPreviewSummary[] =>
  Object.entries(previews ?? {}).map(([previewId, preview]) => ({
    id: previewId,
    title: preview.title,
    url: previewUrl(id, previewId, basePath),
  }));

/** One preview in full, with the component it belongs to so the caller can link back to it. */
export const toPreviewResult = (
  record: ComponentListObject,
  previewId: string,
  preview: OptionalPreviewRender,
  basePath: string,
  document?: string
): ComponentPreviewResult => ({
  component: { id: record.id, title: record.title },
  id: previewId,
  title: preview.title,
  url: previewUrl(record.id, previewId, basePath),
  values: preview.values ?? {},
  usage: preview.usage || undefined,
  html: document ? previewBody(document) : undefined,
});

/**
 * Property names that are content slots by convention. Only consulted for a component with no type
 * information at all, such as a handlebars template; a declared type always wins.
 */
const CONTENT_PROPERTIES = new Set([
  'children',
  'label',
  'title',
  'text',
  'content',
  'description',
  'placeholder',
  'alt',
  'src',
  'href',
  'caption',
  'subtitle',
]);

/**
 * Whether a property's type is a closed set of choices, which is what makes it a variant axis.
 *
 * True for a boolean, for `SlotType`'s `boolean`/`enum`, and for a union of literals
 * (`"sm" | "lg" | undefined`). False for anything open-ended: `string`, `ReactNode`, `SelectOption[]`.
 * `undefined`/`null` members are ignored so an optional prop is judged on its real choices.
 */
const isClosedSet = (type: string | undefined): boolean => {
  if (!type) return false;
  const parts = type
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'undefined' && part !== 'null');
  if (parts.length === 0) return false;
  if (parts.length === 1 && (parts[0] === 'boolean' || parts[0] === 'enum')) return true;
  return parts.every((part) => /^(['"]).*\1$/.test(part) || /^-?\d+(\.\d+)?$/.test(part) || part === 'true' || part === 'false');
};

/**
 * The component's variant axes: the properties that select between visual states, and the values the
 * previews demonstrate for each.
 *
 * A property qualifies on its *type*, not its values. A closed set of choices (an enum, a boolean)
 * is an axis, anything open-ended is content. That is what keeps a button's `children` out of the
 * list: `"Primary Action"` is a label, not a variant, however much it looks like one next to
 * `primary`.
 *
 * With no type information at all, as with a handlebars component, booleans are still axes and
 * strings count unless the property is a conventional content slot. That rule is weaker, so it is
 * only reached when there is nothing better to go on.
 *
 * The values here are the ones the previews show, so each is something you can go and look at.
 * `properties[].type` carries the full declared set, which is usually wider.
 */
export const deriveVariants = (
  previews: { [key: string]: OptionalPreviewRender } | undefined,
  properties: Record<string, ComponentProperty> | undefined
): Record<string, (string | number | boolean)[]> => {
  const axes: Record<string, (string | number | boolean)[]> = {};
  for (const preview of Object.values(previews ?? {})) {
    for (const [property, value] of Object.entries(preview.values ?? {})) {
      const declared = properties?.[property];
      const isAxis = declared
        ? isClosedSet(declared.type)
        : typeof value === 'boolean' || (typeof value === 'string' && !CONTENT_PROPERTIES.has(property.toLowerCase()));
      if (!isAxis) continue;
      if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number') continue;
      if (value === '') continue;
      const values = (axes[property] ??= []);
      if (!values.includes(value)) values.push(value);
    }
  }
  return axes;
};

export interface ComponentResult extends ComponentSummary {
  renderer?: string;
  /** Source format the implementation is written in, when the renderer alone does not say. */
  sourceFormat?: string;
  properties?: Record<string, ComponentProperty>;
  /** Which previews exist and where each is rendered; the bodies come from a preview read. */
  previews: ComponentPreviewSummary[];
  variants: Record<string, (string | number | boolean)[]>;
  /** The first preview's usage snippet. Absent when the renderer generates none, as with handlebars. */
  usage?: string;
  guidelines?: { shouldDo?: string[]; shouldNotDo?: string[] };
  /** This component's token set, when its declaration names the Figma component it maps to. */
  tokens?: { set: string };
}

/** The component's source, as returned by handoff_get_component_source. */
export interface ComponentSourceResult extends Partial<Record<SourceField, string>> {
  id: string;
  title: string;
  renderer?: string;
  sourceFormat?: string;
}

/**
 * The component's own source.
 *
 * The artifact's top-level `html` is left out. That field holds the rendered markup of one preview
 * picked by the renderer (the first for handlebars, the last for react and CSF), and the pick can
 * land on an internal pattern preview that is stripped from `previews` before the artifact is
 * written. So it is markup for a state the response does not describe, with no way for an agent to
 * tell which. Rendered markup is per preview and returned by handoff_get_component_preview, read
 * from that preview's own artifact.
 */
const pickCode = (artifact: TransformComponentTokensResult): Partial<Record<SourceField, string>> => {
  const code: Partial<Record<SourceField, string>> = {};
  for (const field of SOURCE_FIELDS) {
    const value = artifact?.[field];
    if (typeof value === 'string' && value) code[field] = value;
  }
  return code;
};

/**
 * Merge a component record with its build artifact into one agent-facing result.
 *
 * `artifact` is the `component/{id}.json` build output, and is `null` for a component that is
 * declared but not built. That still has usable metadata, so it comes back without `usage` rather
 * than as an error. The source is left out: it is most of the result and an agent writing markup
 * needs the snippet, not the implementation, so it lives behind handoff_get_component_source. So are
 * `sharedStyles`, `validations`, `docgen`, `page`, `options` and the Figma sync fields.
 */
export const toComponentResult = (
  record: ComponentListObject,
  artifact: TransformComponentTokensResult | null,
  basePath: string,
  tokenSetIds: readonly string[] = []
): ComponentResult => {
  const previews = artifact?.previews ?? record.previews;
  const properties = toProperties(artifact?.properties ?? record.properties);
  // The docs record does not carry the guidelines; the build artifact does.
  const shouldDo = nonEmpty(artifact?.should_do ?? record.should_do);
  const shouldNotDo = nonEmpty(artifact?.should_not_do ?? record.should_not_do);

  return {
    ...toComponentSummary(record),
    renderer: artifact?.renderer ?? record.renderer,
    sourceFormat: artifact?.sourceFormat ?? record.sourceFormat,
    properties,
    previews: toPreviewIndex(record.id, previews, basePath),
    variants: deriveVariants(previews, properties),
    usage: Object.values(previews ?? {})[0]?.usage || undefined,
    guidelines: shouldDo || shouldNotDo ? { shouldDo, shouldNotDo } : undefined,
    tokens: componentTokenSet(record, tokenSetIds),
  };
};

/** The component's source, or only its identity when it has not been built. */
export const toComponentSource = (record: ComponentListObject, artifact: TransformComponentTokensResult | null): ComponentSourceResult => ({
  id: record.id,
  title: record.title,
  renderer: artifact?.renderer ?? record.renderer,
  sourceFormat: artifact?.sourceFormat ?? record.sourceFormat,
  ...(artifact ? pickCode(artifact) : {}),
});

/**
 * The component's token set, when one can be named with certainty.
 *
 * A token set is keyed by the *Figma* component name, which need not match the component's own id:
 * `button` is backed by `component/buttons` here, and a code-only component has no set at all. The
 * declaration's `figmaComponentId` is the join, and without it there is nothing to match on, so
 * nothing is claimed. Guessing `component/{id}` would quietly point `button` at a set that does not
 * exist.
 *
 * Returned as `{ set }` rather than a bare string so the value reads as a set id to pass to
 * `handoff_get_tokens`, not as the tokens themselves.
 */
const componentTokenSet = (record: ComponentListObject, tokenSetIds: readonly string[]): { set: string } | undefined => {
  const figmaId = record.figmaComponentId?.trim();
  if (!figmaId) {
    return undefined;
  }
  const set = `component/${figmaId}`;
  return tokenSetIds.includes(set) ? { set } : undefined;
};
