import { buildArtifactUrl } from '@handoff/artifacts/url';
import type { SlotMetadata } from '@handoff/transformers/preview/component';
import type { ComponentListObject, OptionalPreviewRender, TransformComponentTokensResult } from '@handoff/transformers/preview/types';
import type { TokenArtifactResource } from '@handoff/store';

/**
 * Agent-facing projections of the store records.
 *
 * The docs read API returns records verbatim because the browser app needs every field. An MCP
 * client pays for each field in context, so everything here is a deliberate narrowing: build config,
 * validation state, absolute paths and Figma sync ids are dropped, and the rest is reshaped into the
 * flatter arrays an agent can act on. Pure functions only, no I/O.
 */

/** The generated-code fields an agent can ask for; the build artifact carries them under these names. */
export const CODE_FIELDS = ['code', 'html', 'css', 'sass', 'js'] as const;
export type CodeField = (typeof CODE_FIELDS)[number];

/**
 * One row of a component search result: identity and classification, and nothing else.
 *
 * Search answers "which component do I want", so a row carries only what tells one component from
 * another. Previews, properties and code belong to handoff_get_component.
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

export const toComponentSummary = (record: ComponentListObject): ComponentSummary => ({
  id: record.id,
  title: record.title,
  description: record.description || undefined,
  group: record.group || undefined,
  type: record.type || undefined,
  categories: record.categories?.length ? record.categories : undefined,
  tags: record.tags?.length ? record.tags : undefined,
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

export interface ComponentPreview {
  id: string;
  title: string;
  values: Record<string, unknown>;
  usage?: string;
  /** Canonical URL of the rendered preview artifact. */
  url: string;
  /** Markup this preview renders to, when the caller asked for `html`. */
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
 * Previews with their rendered-artifact URL filled in, and their markup when `documents` carries it.
 * The builder writes the record's own `url` empty, so it is derived here the way the docs UI does.
 */
export const toPreviews = (
  id: string,
  previews: { [key: string]: OptionalPreviewRender } | undefined,
  basePath: string,
  documents: Record<string, string> = {}
): ComponentPreview[] =>
  Object.entries(previews ?? {}).map(([previewId, preview]) => ({
    id: previewId,
    title: preview.title,
    values: preview.values ?? {},
    usage: preview.usage || undefined,
    url: buildArtifactUrl(`component/${id}-${previewId}.html`, basePath),
    html: documents[previewId] ? previewBody(documents[previewId]) : undefined,
  }));

/**
 * Property names that are content slots by convention. Only consulted for a component with no type
 * information at all, such as a handlebars template; a declared type always wins.
 */
const CONTENT_PROPERTIES = new Set([
  'children', 'label', 'title', 'text', 'content', 'description',
  'placeholder', 'alt', 'src', 'href', 'caption', 'subtitle',
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

export interface ComponentResult {
  id: string;
  title: string;
  description?: string;
  group?: string;
  type?: string;
  renderer?: string;
  categories?: string[];
  tags?: string[];
  properties?: Record<string, ComponentProperty>;
  previews: ComponentPreview[];
  variants: Record<string, (string | number | boolean)[]>;
  usage: { general?: string; shouldDo?: string[]; shouldNotDo?: string[] };
  /** The component's source, narrowed by the caller's `include`. Absent when it is not built. */
  code?: Partial<Record<Exclude<CodeField, 'html'>, string>>;
  /** This component's token set, when its declaration names the Figma component it maps to. */
  tokens?: { set: string };
}

/**
 * The component's own source, per the caller's `include`.
 *
 * `html` is left out even though the artifact has a top-level field by that name. That field holds
 * the rendered markup of one preview picked by the renderer (the first for handlebars, the last for
 * react and CSF), and the pick can land on an internal pattern preview that is stripped from
 * `previews` before the artifact is written. So it is markup for a state the response does not
 * describe, with no way for an agent to tell which. Rendered markup is per preview and returned
 * there, read from each preview's own artifact.
 */
const pickCode = (
  artifact: TransformComponentTokensResult,
  include: readonly CodeField[]
): Partial<Record<Exclude<CodeField, 'html'>, string>> => {
  const code: Partial<Record<Exclude<CodeField, 'html'>, string>> = {};
  for (const field of include) {
    if (field === 'html') continue;
    const value = artifact?.[field];
    if (typeof value === 'string' && value) code[field] = value;
  }
  return code;
};

/**
 * Merge a component record with its build artifact into one agent-facing result.
 *
 * `artifact` is the `component/{id}.json` build output, and is `null` for a component that is
 * declared but not built. That still has usable metadata, so it comes back without `code` rather
 * than as an error. The compiled `sharedStyles` blob is left out: it is the bulk of the artifact and
 * is shared across every component, so it says nothing about this one. So are `validations`,
 * `entries` (absolute workspace paths), `docgen`, `page`, `options` and the Figma sync fields.
 */
export const toComponentResult = (
  record: ComponentListObject,
  artifact: TransformComponentTokensResult | null,
  include: readonly CodeField[],
  basePath: string,
  tokenSetIds: readonly string[] = [],
  previewDocuments: Record<string, string> = {}
): ComponentResult => {
  const previews = artifact?.previews ?? record.previews;
  const code = artifact ? pickCode(artifact, include) : undefined;
  const properties = toProperties(artifact?.properties ?? record.properties);
  const usagePreviews = Object.values(previews ?? {}).map((preview) => preview.usage);
  // The artifact's `usage` is one preview's snippet repeated at the top level. Only surface it when
  // it is not already sitting in `previews`, so it does not read as component-level guidance.
  const general = artifact?.usage && !usagePreviews.includes(artifact.usage) ? artifact.usage : undefined;

  return {
    id: record.id,
    title: record.title,
    description: record.description || undefined,
    group: record.group || undefined,
    type: record.type || undefined,
    // The workspace summary omits `renderer` while the registry has a column for it. The artifact
    // carries it either way, so prefer that and both modes agree.
    renderer: artifact?.renderer ?? record.renderer,
    categories: record.categories?.length ? record.categories : undefined,
    tags: record.tags?.length ? record.tags : undefined,
    properties,
    previews: toPreviews(record.id, previews, basePath, previewDocuments),
    variants: deriveVariants(previews, properties),
    usage: {
      general,
      shouldDo: record.should_do?.length ? record.should_do : undefined,
      shouldNotDo: record.should_not_do?.length ? record.should_not_do : undefined,
    },
    code: code && Object.keys(code).length > 0 ? code : undefined,
    tokens: componentTokenSet(record, tokenSetIds),
  };
};

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

/**
 * Drop the Figma node id from every token record.
 *
 * Colors, typography, effects and component instances each carry an `id` that is a Figma node
 * reference, which an agent cannot use. Everything else (`sass`, `reference`, `machineName`,
 * `values`, `parts`, `variantProperties`) survives, so nothing that affects generated code is lost.
 */
export const stripFigmaIds = (record: unknown): unknown => {
  if (Array.isArray(record)) return record.map(stripFigmaIds);
  if (record && typeof record === 'object') {
    const { id: _id, ...rest } = record as Record<string, unknown>;
    return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, stripFigmaIds(value)]));
  }
  return record;
};

/** The generated formats available for a token set, deduped and in artifact order. */
export const availableFormats = (artifacts: TokenArtifactResource[]): string[] =>
  Array.from(new Set(artifacts.map((artifact) => artifact.format)));

/**
 * Foundation tokens, reshaped into what an agent needs to write code.
 *
 * Neither the stored record nor the generated stylesheet is usable on its own. The record says a type
 * style is called `Heading 1` but nothing in it yields the variable to emit: its `reference` is
 * `typography--heading-1` while the real variables are `--typography-heading-1-font-size` and
 * friends, and it carries raw Figma fields (`textAutoResize`, three competing `lineHeight*`
 * encodings) that never become CSS. The stylesheet has the right names and resolved values but has
 * flattened away the human name and the grouping.
 *
 * So the two are joined. Names and values come from the generated CSS, token identity from the
 * generated `types` list, and `name`/`group` from the record. Nothing is reconstructed from a naming
 * rule of our own, since the rule differs per set and typography would come out wrong.
 *
 * Foundations only. Component sets are multi-axis (part x state x theme x property) and their
 * `types` artifact lists axes rather than token names, so there is no honest join to make.
 */

/** One foundation token: a single value, or a bundle of properties under a shared variable prefix. */
export interface FoundationToken {
  /** Human-facing name from the record, when it could be matched unambiguously. */
  name?: string;
  /** Record group (e.g. `primary`, `shadow`), when set. */
  group?: string;
  /** The CSS custom property, for a single-value token. */
  css?: string;
  /** Resolved value, for a single-value token. */
  value?: string;
  /** Shared variable prefix, for a bundled token: each property is `{cssPrefix}-{property}`. */
  cssPrefix?: string;
  /** Resolved values keyed by CSS property, for a bundled token. */
  properties?: Record<string, string>;
}

/** Parse `--name: value;` declarations out of a generated stylesheet. */
export const cssVariables = (content: string): Record<string, string> => {
  const variables: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = /^\s*--([\w-]+)\s*:\s*(.+?);\s*$/.exec(line);
    if (match) {
      variables[match[1]] = match[2].trim();
    }
  }
  return variables;
};

/**
 * Token names from a generated `types` artifact, read out of its quoted string list (`$color-names`,
 * `$type-sizes`, `$effects`). Without it there is no telling whether `--color-primary-blue-darker`
 * is a `darker` property of `primary-blue` or a token in its own right. It is the latter, and only
 * this list says so.
 */
export const tokenNamesFromTypes = (content: string): string[] =>
  // `[^"]*` not `[^"]+`: the list can carry an empty entry (`$color-groups` ends with `""`), and a
  // pattern that cannot match it pairs that entry's closing quote with the next entry's opening one,
  // knocking every later name out of alignment. Empty names are dropped after matching, not during.
  Array.from(new Set(Array.from(content.matchAll(/"([^"]*)"/g), (match) => match[1]))).filter(Boolean);

/**
 * Assign a CSS variable to the longest token name that matches, returning the leftover as a property.
 * Longest first is what keeps `primary-blue-darker` from being read as `primary-blue` + `darker`.
 */
const claimVariable = (variable: string, namesByLength: string[]): { token: string; property?: string } | null => {
  for (const token of namesByLength) {
    if (variable === token || variable.endsWith(`-${token}`)) {
      return { token };
    }
    const at = variable.indexOf(`-${token}-`);
    if (at >= 0) {
      return { token, property: variable.slice(at + token.length + 2) };
    }
    if (variable.startsWith(`${token}-`)) {
      return { token, property: variable.slice(token.length + 1) };
    }
  }
  return null;
};

/** A foundation record, as far as the join cares. */
type FoundationRecord = { name?: string; group?: string; reference?: string; machineName?: string; machine_name?: string };

/**
 * The record describing one token. Matched on `reference`, which ends with the token name across all
 * three foundation kinds. More than one candidate means it is ambiguous, so nothing is attached: a
 * token without its label beats a token with the wrong one.
 */
const recordFor = (token: string, records: FoundationRecord[]): FoundationRecord | null => {
  const matches = records.filter(
    (record) =>
      record?.reference === token ||
      record?.reference?.endsWith(`-${token}`) ||
      record?.machineName === token ||
      record?.machine_name === token
  );
  return matches.length === 1 ? matches[0] : null;
};

/**
 * Reshape a foundation set. Returns `null` when the inputs are missing (no CSS or `types` artifact,
 * or nothing parsed out of them) so the caller can fall back to the stylesheet or the record.
 */
export const synthesizeFoundationTokens = (
  record: unknown,
  artifacts: TokenArtifactResource[]
): Record<string, FoundationToken> | null => {
  const css = artifacts.find((artifact) => artifact.format === 'css');
  const types = artifacts.find((artifact) => artifact.format === 'types');
  if (!css || !types) {
    return null;
  }

  const variables = cssVariables(css.content);
  const namesByLength = tokenNamesFromTypes(types.content).sort((a, b) => b.length - a.length);
  if (Object.keys(variables).length === 0 || namesByLength.length === 0) {
    return null;
  }

  const records: FoundationRecord[] = Array.isArray(record) ? record : [];
  const tokens: Record<string, FoundationToken> = {};

  for (const [variable, value] of Object.entries(variables)) {
    const claim = claimVariable(variable, namesByLength);
    if (!claim) {
      continue;
    }
    const entry = (tokens[claim.token] ??= {});
    if (!entry.name) {
      const matched = recordFor(claim.token, records);
      if (matched?.name) entry.name = matched.name;
      if (matched?.group) entry.group = matched.group;
    }
    if (claim.property) {
      entry.cssPrefix = `--${variable.slice(0, variable.length - claim.property.length - 1)}`;
      (entry.properties ??= {})[claim.property] = value;
    } else {
      entry.css = `--${variable}`;
      entry.value = value;
    }
  }

  return Object.keys(tokens).length > 0 ? tokens : null;
};

/** One variant of a component: the axis values it applies to, and the variables it sets. */
export interface ComponentTokenVariant {
  /** Axis values, e.g. `{ state: 'disabled', theme: 'dark' }`. Empty for a component with no variants. */
  variant: Record<string, string>;
  /** Full CSS custom property names to resolved values. */
  variables: Record<string, string>;
}

/**
 * Component tokens, grouped by the variant they belong to.
 *
 * A component set is keyed by part x variant x property and the variable name runs them together
 * (`--select-additional-disabled-dark-border-color`) with no boundary that can be split on safely.
 * The generated stylesheet already labels each group, though: `getComponentCommentBlock` emits
 * `/* Select, state: disabled, theme: dark *\/` ahead of every block, built from the instance's
 * `variantProperties`. So the grouping is read off the generator's own output and variables are kept
 * whole rather than split by a guessed rule.
 *
 * No axes are advertised and nothing is resolved per brand or scheme. The variants already exist in
 * the build output; this only groups them.
 */
export const synthesizeComponentTokens = (artifacts: TokenArtifactResource[]): ComponentTokenVariant[] | null => {
  const css = artifacts.find((artifact) => artifact.format === 'css');
  if (!css) {
    return null;
  }

  const variants: ComponentTokenVariant[] = [];
  let current: ComponentTokenVariant | null = null;

  for (const line of css.content.split('\n')) {
    const comment = /^\s*\/\*\s*(.+?)\s*\*\/\s*$/.exec(line);
    if (comment) {
      // The first comma-separated part is the component name; the rest are `key: value` axis pairs.
      const variant: Record<string, string> = {};
      for (const part of comment[1].split(',').slice(1)) {
        const [key, ...rest] = part.split(':');
        if (rest.length > 0) {
          variant[key.trim().toLowerCase()] = rest.join(':').trim();
        }
      }
      current = { variant, variables: {} };
      variants.push(current);
      continue;
    }
    const declaration = /^\s*--([\w-]+)\s*:\s*(.+?);\s*$/.exec(line);
    if (declaration) {
      // A component with no variants emits no header, so open an unlabelled group for it.
      if (!current) {
        current = { variant: {}, variables: {} };
        variants.push(current);
      }
      current.variables[`--${declaration[1]}`] = declaration[2].trim();
    }
  }

  const populated = variants.filter((entry) => Object.keys(entry.variables).length > 0);
  return populated.length > 0 ? populated : null;
};
