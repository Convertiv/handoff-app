import type { TokenArtifactResource } from '@handoff/store';
import type { DocsBackend, TokenSetDetail } from '../docs-api/backend';
import { fail, ok, read } from './result';
import { defineTool, type McpTool } from './tool';

/** The token tool, and the reshaping that turns stored token sets into variables an agent can emit. */

type TokenFormat = 'css' | 'scss' | 'styleDictionary' | 'types';

export const tokenTools: McpTool[] = [
  defineTool<{ set?: string; kind?: 'foundation' | 'component'; format?: TokenFormat }>(
    {
      name: 'handoff_get_tokens',
      title: 'Get design tokens',
      description:
        'Design tokens. With no arguments: the list of token sets, plus all foundation tokens (colors, ' +
        'typography, effects). With `set`: one set. With `set` and `format`: the generated file for ' +
        'that set. A foundation token has `css` and `value`, or `cssPrefix` and `properties` (each ' +
        'variable is `{cssPrefix}-{property}`). A component set has `variants`: the axis values of each ' +
        'variant and the variables it sets. Use the CSS variable, not the literal value, unless no ' +
        'stylesheet is available.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          set: { type: 'string', description: 'Token set id from the list, for example "foundation/colors".' },
          kind: {
            type: 'string',
            enum: ['foundation', 'component'],
            description: 'Without `set`: list only sets of this kind. `component` leaves out the foundation tokens.',
          },
          format: {
            type: 'string',
            enum: ['css', 'scss', 'styleDictionary', 'types'] satisfies TokenFormat[],
            description: 'With `set`: return the generated file in this format.',
          },
        },
      },
    },
    async ({ set, kind, format }) =>
      read(set ? `token set "${set}"` : 'the token catalog', async (backend) => {
        if (!set) {
          if (format) {
            return fail('`format` needs a `set`. Call handoff_get_tokens with no arguments to list the available sets.');
          }
          return ok(await listTokens(backend, kind));
        }

        const detail = await backend.getTokenSetDetail(set);
        if (!detail) {
          return fail(`Token set "${set}" was not found. Call handoff_get_tokens with no arguments to list the available sets.`);
        }
        if (!format) {
          return ok({ id: detail.id, kind: detail.kind, formats: availableFormats(detail.artifacts), ...tokenPayload(detail) });
        }

        const artifact = detail.artifacts.find((candidate) => candidate.format === format);
        if (!artifact) {
          const formats = availableFormats(detail.artifacts);
          return fail(
            `Token set "${set}" has no "${format}" output. ${formats.length ? `Available formats: ${formats.join(', ')}.` : 'It has no generated output.'}`
          );
        }
        return ok({ id: detail.id, kind: detail.kind, format, path: artifact.path, content: artifact.content });
      })
  ),
];

/**
 * A token set's payload, under a key naming which of the four forms it is, so the agent never has to
 * guess: `tokens` for a foundation, `variants` for a component, or one of the two fallbacks.
 *
 * When neither reshape is possible we degrade rather than fail. The generated `stylesheet` still
 * lets an agent write correct code, and the raw `record` is the last resort, which is what a
 * workspace with unbuilt tokens gets.
 */
const tokenPayload = (detail: TokenSetDetail): Record<string, unknown> => {
  const reshaped =
    detail.kind === 'foundation'
      ? synthesizeFoundationTokens(detail.record, detail.artifacts)
      : synthesizeComponentTokens(detail.artifacts);
  if (reshaped) {
    return detail.kind === 'foundation' ? { tokens: reshaped } : { variants: reshaped };
  }
  const stylesheet = detail.artifacts.find((a) => a.format === 'css') ?? detail.artifacts.find((a) => a.format === 'scss');
  if (stylesheet) {
    return { format: stylesheet.format, stylesheet: stylesheet.content };
  }
  return { record: stripFigmaIds(detail.record) };
};

/**
 * The token catalog. Foundation tokens are inlined because they are what an agent needs before it
 * writes anything. Component sets are listed by id and fetched one at a time, since inlining them
 * all would be most of the design system in one response.
 */
const listTokens = async (backend: DocsBackend, kind?: 'foundation' | 'component') => {
  const sets = (await backend.listTokenSets()).filter((candidate) => !kind || candidate.kind === kind);
  if (kind === 'component') {
    return { sets };
  }

  const foundations: Record<string, unknown> = {};
  for (const candidate of sets.filter((entry) => entry.kind === 'foundation')) {
    const detail = await backend.getTokenSetDetail(candidate.id);
    if (detail) {
      foundations[candidate.id] = tokenPayload(detail);
    }
  }
  return { sets, foundations };
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

/** One `--name: value;` line of a generated stylesheet. */
const CSS_DECLARATION = /^\s*--([\w-]+)\s*:\s*(.+?);\s*$/;

/** Parse `--name: value;` declarations out of a generated stylesheet. */
export const cssVariables = (content: string): Record<string, string> => {
  const variables: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = CSS_DECLARATION.exec(line);
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
export const synthesizeFoundationTokens = (record: unknown, artifacts: TokenArtifactResource[]): Record<string, FoundationToken> | null => {
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
    const declaration = CSS_DECLARATION.exec(line);
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
