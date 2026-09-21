import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ComponentListObject, TransformComponentTokensResult } from '@handoff/transformers/preview/types';
import { resolveDocsBackend } from '../docs-api';
import type { DocsBackend, TokenSetDetail } from '../docs-api/backend';
import { createSearchRequest, DEFAULT_RESULT_LIMIT, MAX_QUERY_LENGTH, MAX_RESULT_LIMIT, MAX_TERMS } from '../docs-api/search';
import {
  availableFormats,
  matchesComponent,
  pageIdFromUrl,
  stripFigmaIds,
  synthesizeComponentTokens,
  synthesizeFoundationTokens,
  toComponentResult,
  toComponentSummary,
  toPageResult,
  toPreviewResult,
} from './shape';

/**
 * The Handoff MCP server: read-only access to the design system's components, tokens and pages.
 *
 * Every tool reads through {@link resolveDocsBackend}, the same mode-aware backing the `/api/docs/*`
 * routes use, so workspace and registry deployments answer identically. Results are projections (see
 * `./shape`) rather than raw records, since an agent pays for every field it is handed.
 *
 * A fresh server is built per request because the transport is stateless; nothing here holds state
 * between calls.
 */

/** Version of the MCP surface itself, reported in `initialize`. Bump when a tool contract changes. */
const MCP_SERVER_VERSION = '2.0.0';

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

export const createMcpServer = (): McpServer => {
  const server = new McpServer(
    { name: 'handoff', version: MCP_SERVER_VERSION },
    {
      instructions:
        'Design-system knowledge for this project. Before writing UI code, search for an existing ' +
        'component with handoff_search_components, read its props and variants with ' +
        'handoff_get_component, and take colors, typography and spacing from handoff_get_tokens ' +
        'rather than inventing values. To see one state in full, pass a preview id from that ' +
        "component's preview index to handoff_get_component_preview. Search documentation with " +
        'handoff_search_pages, then pass a result URL to handoff_get_page for the full Markdown content.',
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
        'One component by id: its properties, variant axes (the values previews demonstrate for each ' +
        'choice-typed property — `properties[].type` has the full set), usage guidance and its source ' +
        '(`code`/`css`/`sass`/`js`). Use this before writing markup for a component that already ' +
        "exists. `previews` lists the component's states by id, title and URL; pass a preview id to " +
        'handoff_get_component_preview for the args it passes and the markup it renders to. ' +
        '`tokens.set` names its token set for handoff_get_tokens when the component declares which ' +
        'Figma component it maps to; token sets are keyed by Figma name, so do not assume it matches ' +
        'the component id.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe('Component id, as returned by handoff_search_components.'),
      },
    },
    async ({ id }) =>
      read(`component "${id}"`, async (backend) => {
        const record = await backend.getComponentDetail(id);
        if (!record) {
          return fail(`Component "${id}" was not found. Use handoff_search_components to list the components that exist.`);
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
  );

  server.registerTool(
    'handoff_get_component_preview',
    {
      title: 'Get component preview',
      description:
        'One preview of one component: `values`, the args it passes; `usage`, the snippet that ' +
        'produces it; and `html`, the markup it renders to. Use it to see a single state in full ' +
        'after handoff_get_component has listed which states exist. `html` is absent for a component ' +
        'that has not been built.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        id: z.string().describe('Component id, as returned by handoff_search_components.'),
        preview: z.string().describe('Preview id, as listed in `previews[].id` by handoff_get_component.'),
      },
    },
    async ({ id, preview }) =>
      read(`preview "${preview}" of component "${id}"`, async (backend) => {
        const record = await backend.getComponentDetail(id);
        if (!record) {
          return fail(`Component "${id}" was not found. Use handoff_search_components to list the components that exist.`);
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

  server.registerTool(
    'handoff_search_pages',
    {
      title: 'Search pages',
      description:
        'Search documentation titles, descriptions and Markdown bodies. Returns ranked matches with ' +
        'internal URLs and snippets. Returns { query, results, truncated }; each result has url, title, ' +
        'optional description and snippet. If truncated is true, narrow the query or group to find more ' +
        'specific matches. Project pages replace package defaults at the same route; disabled pages ' +
        'are excluded. External-link pages match visible metadata only. Pass a result URL to ' +
        'handoff_get_page for the full content.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        query: z
          .string()
          .describe(
            `Required search text, at most ${MAX_QUERY_LENGTH} characters and ${MAX_TERMS} distinct terms. ` +
              'Terms shorter than two characters are ignored; at least one longer term is required. ' +
              'Matching ignores case and treats hyphens and underscores as spaces.'
          ),
        group: z.string().optional().describe('Exact group name, matched case-insensitively.'),
        limit: z.number().int().min(1).max(MAX_RESULT_LIMIT).optional().describe(`Max results (default ${DEFAULT_RESULT_LIMIT}).`),
      },
    },
    async ({ query, group, limit }) => {
      const parsed = createSearchRequest(query, limit?.toString());
      if ('error' in parsed) {
        return fail(parsed.error.replace('`q` search parameter', '`query` argument'));
      }
      return read('pages', async (backend) => ok(await backend.searchPages({ ...parsed.request, group: group?.trim() || undefined })));
    }
  );

  server.registerTool(
    'handoff_get_page',
    {
      title: 'Get page',
      description:
        'Read a documentation page by its internal URL from handoff_search_pages, such as /guides/setup ' +
        'or / for the home page. Returns id, url, title, optional description, group and external, ' +
        'plus content containing the full Markdown body without frontmatter. Project pages replace ' +
        'package defaults at the same route. A missing page returns a tool error. ' +
        'External-link pages return their stored content; external destinations are not fetched.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        url: z.string().describe('Internal page route without a site base path, query string or fragment. A trailing slash is accepted.'),
      },
    },
    async ({ url }) => {
      const id = pageIdFromUrl(url);
      if (id === null) {
        return fail('Provide an internal page URL such as /guides/setup or /, without a query string, fragment or traversal segments.');
      }
      return read(`page "${url}"`, async (backend) => {
        const page = await backend.getPageDetail(id);
        if (!page) {
          return fail(`Page "${url}" was not found. Use handoff_search_pages to find available pages.`);
        }
        return ok(toPageResult(page));
      });
    }
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
