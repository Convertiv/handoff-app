import type { PageDetail } from '../docs-api/records';
import { createSearchRequest, DEFAULT_RESULT_LIMIT, MAX_QUERY_LENGTH, MAX_RESULT_LIMIT, MAX_TERMS } from '../docs-api/search';
import { pageIdFromUrl } from './page-url';
import { fail, ok, read } from './result';
import { defineTool, type McpTool } from './tool';

/** The documentation page tools: search and read. */

export const pageTools: McpTool[] = [
  defineTool<{ query: string; group?: string; limit?: number }>(
    {
      name: 'handoff_search_pages',
      title: 'Search pages',
      description:
        'Search documentation pages by title, description and Markdown body. Returns ranked `results` ' +
        'with `url`, `title`, `description` and `snippet`. `truncated` is true when more matches exist. ' +
        'Read a page with handoff_get_page.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              `Search text, at most ${MAX_QUERY_LENGTH} characters and ${MAX_TERMS} terms. Case-insensitive. ` +
              'Terms shorter than two characters are ignored.',
          },
          group: { type: 'string', description: 'Page group name. Exact match, case-insensitive.' },
          limit: { type: 'integer', minimum: 1, maximum: MAX_RESULT_LIMIT, description: `Max results (default ${DEFAULT_RESULT_LIMIT}).` },
        },
        required: ['query'],
      },
    },
    async ({ query, group, limit }) => {
      const parsed = createSearchRequest(query, limit?.toString());
      if ('error' in parsed) {
        return fail(parsed.error.replace('`q` search parameter', '`query` argument'));
      }
      return read('pages', async (backend) => ok(await backend.searchPages({ ...parsed.request, group: group?.trim() || undefined })));
    }
  ),

  defineTool<{ url: string }>(
    {
      name: 'handoff_get_page',
      title: 'Get page',
      description:
        'One documentation page by its URL from handoff_search_pages, for example /guides/setup, or / ' +
        'for the home page. Returns the page metadata and `content`, the full Markdown body. For an ' +
        'external-link page, the external site is not fetched.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Internal route, without a base path, query string or fragment.' },
        },
        required: ['url'],
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
  ),
];

export const toPageResult = (page: PageDetail) => ({
  id: page.id,
  url: page.path,
  title: page.title,
  description: page.description,
  group: page.group,
  external: page.external,
  content: page.content,
});
