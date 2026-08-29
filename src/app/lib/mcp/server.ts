import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ComponentListObject, TransformComponentTokensResult } from '@handoff/transformers/preview/types';
import { resolveDocsBackend } from '../docs-api';
import type { DocsBackend, TokenSetDetail } from '../docs-api/backend';
import {
  availableFormats,
  CODE_FIELDS,
  matchesComponent,
  stripFigmaIds,
  synthesizeComponentTokens,
  synthesizeFoundationTokens,
  toComponentResult,
  toComponentSummary,
  type CodeField,
} from './shape';

/**
 * The Handoff MCP server: read-only access to the design system's components and tokens.
 *
 * Every tool reads through {@link resolveDocsBackend}, the same mode-aware backing the `/api/docs/*`
 * routes use, so workspace and registry deployments answer identically. Results are projections (see
 * `./shape`) rather than raw records, since an agent pays for every field it is handed.
 *
 * A fresh server is built per request because the transport is stateless; nothing here holds state
 * between calls.
 */

/** Version of the MCP surface itself, reported in `initialize`. Bump when a tool contract changes. */
const MCP_SERVER_VERSION = '1.0.0';

/** Search results are capped so a large design system cannot flood an agent's context. */
const DEFAULT_SEARCH_LIMIT = 25;
const MAX_SEARCH_LIMIT = 100;

/** Base path the docs app is mounted under, so emitted preview URLs are actually fetchable. */
const basePath = (): string => process.env.HANDOFF_APP_BASE_PATH ?? '';

/**
 * A successful tool result: one JSON text block, serialized verbatim the way every other API response
 * is. A tool only ever returns design-system content read through {@link resolveDocsBackend}, so
 * there is nothing here to withhold from a caller already authorized to read it.
 */
const ok = (data: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

/** A failed tool result. Not-found and bad-argument are tool errors, not protocol errors. */
const fail = (message: string): CallToolResult => ({ isError: true, content: [{ type: 'text', text: message }] });

/**
 * Run a tool body, turning an unexpected read failure into a safe message. The cause is logged
 * server-side and never returned, matching the docs read API's `unexpected_error`.
 */
const read = async (what: string, body: (backend: DocsBackend) => Promise<CallToolResult>): Promise<CallToolResult> => {
  try {
    return await body(await resolveDocsBackend());
  } catch (error) {
    console.error(`MCP read failed: ${what}.`, error);
    return fail(`Unable to read ${what}.`);
  }
};

/**
 * Each preview's rendered document, keyed by preview id. A preview with no artifact (an unbuilt
 * component) is left out, so the rest still come back.
 */
const readPreviewDocuments = async (backend: DocsBackend, id: string, previewIds: string[]): Promise<Record<string, string>> => {
  const documents = await Promise.all(
    previewIds.map(async (previewId) => {
      const artifact = await backend.resolveArtifact(['component', `${id}-${previewId}.html`]);
      return [previewId, artifact?.body.toString() ?? ''] as const;
    })
  );
  return Object.fromEntries(documents.filter(([, document]) => document));
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

export const createMcpServer = (): McpServer => {
  const server = new McpServer(
    { name: 'handoff', version: MCP_SERVER_VERSION },
    {
      instructions:
        'Design-system knowledge for this project. Before writing UI code, search for an existing ' +
        'component with handoff_search_components, read its props and variants with ' +
        'handoff_get_component, and take colors, typography and spacing from handoff_get_tokens ' +
        'rather than inventing values.',
    }
  );

  server.registerTool(
    'handoff_search_components',
    {
      title: 'Search components',
      description:
        'Search the component catalog by id, title, group, category or tag. Returns identity and ' +
        'classification only; pass an id to handoff_get_component for previews, props, variants and ' +
        'code. Call with no arguments to list everything.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        query: z.string().optional().describe('Case-insensitive substring matched against id, title, group, categories and tags.'),
        group: z.string().optional().describe('Exact group name, e.g. "Forms".'),
        category: z.string().optional().describe('Exact category name.'),
        tag: z.string().optional().describe('Exact tag name.'),
        limit: z.number().int().min(1).max(MAX_SEARCH_LIMIT).optional().describe(`Max results (default ${DEFAULT_SEARCH_LIMIT}).`),
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
  );

  server.registerTool(
    'handoff_get_component',
    {
      title: 'Get component',
      description:
        'One component by id: its properties, previews, variant axes (the values previews demonstrate ' +
        'for each choice-typed property — `properties[].type` has the full set), usage guidance and its ' +
        'source (`code`/`css`/`sass`/`js`). Each preview also carries the markup it renders to, as ' +
        '`previews[].html`, so rendered output is always tied to the state it came from. Use this ' +
        'before writing markup for a component that already exists. `tokens.set` names its token set ' +
        'for handoff_get_tokens when the component declares which Figma component it maps to; token ' +
        'sets are keyed by Figma name, so do not assume it matches the component id.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe('Component id, as returned by handoff_search_components.'),
        include: z
          .array(z.enum(CODE_FIELDS))
          .optional()
          .describe(
            'Which code fields to return. Omit for all of them; narrow it to keep the response small. ' +
              '`html` is rendered markup and lands on each preview, not in `code`.'
          ),
      },
    },
    async ({ id, include }) =>
      read(`component "${id}"`, async (backend) => {
        const record = await backend.getComponentDetail(id);
        if (!record) {
          return fail(`Component "${id}" was not found. Use handoff_search_components to list the components that exist.`);
        }
        const [artifact, tokenSets] = await Promise.all([readComponentArtifact(backend, id), backend.listTokenSets()]);
        const fields = (include as CodeField[]) ?? CODE_FIELDS;
        const previewDocuments = fields.includes('html')
          ? await readPreviewDocuments(backend, id, Object.keys(artifact?.previews ?? record.previews ?? {}))
          : {};
        return ok(
          toComponentResult(
            record,
            artifact,
            fields,
            basePath(),
            tokenSets.map((set) => set.id),
            previewDocuments
          )
        );
      })
  );

  server.registerTool(
    'handoff_get_tokens',
    {
      title: 'Get design tokens',
      description:
        'Design tokens. With no arguments: every available token set, plus the foundation tokens ' +
        '(colors, typography, effects) inline. With `set`: that one set. With `set` and `format`: the ' +
        'generated stylesheet, verbatim. Use these tokens instead of hard-coding colors or type.\n' +
        'A foundation token gives either `css` + `value` (a single variable) or `cssPrefix` + ' +
        '`properties` (a bundle, where each variable is `{cssPrefix}-{property}`). A component set ' +
        'gives `variants`: one entry per variant combination, with the axis values it applies to and ' +
        'the variables it sets. Emit the variable, not the literal, unless you have no stylesheet to ' +
        'reference.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        set: z.string().optional().describe('Token set id, e.g. "foundation/colors" or "component/button".'),
        kind: z.enum(['foundation', 'component']).optional().describe('Restrict the listing to one kind of set.'),
        format: z
          .enum(['css', 'scss', 'styleDictionary', 'types'])
          .optional()
          .describe('Return the generated stylesheet for `set` in this format instead of the token record.'),
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
  );

  return server;
};

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
