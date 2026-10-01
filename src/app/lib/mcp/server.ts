import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerComponentTools } from './components';
import { registerPageTools } from './pages';
import { registerTokenTools } from './tokens';

/**
 * The Handoff MCP server: read-only access to the design system's components, tokens and pages.
 *
 * Every tool reads through `resolveDocsBackend`, the same mode-aware backing the `/api/docs/*` routes
 * use, so workspace and registry deployments answer identically.
 *
 * Results are projections rather than raw records. The docs read API returns records verbatim because
 * the browser app needs every field. An MCP client pays for each field in context, so each domain
 * module narrows its records: build config, validation state, absolute paths and Figma sync ids are
 * dropped, and the rest is reshaped into the flatter arrays an agent can act on.
 *
 * A fresh server is built per request because the transport is stateless; nothing here holds state
 * between calls.
 */

/** Version of the MCP surface itself, reported in `initialize`. Bump when a tool contract changes. */
const MCP_SERVER_VERSION = '2.0.0';

export const createMcpServer = (): McpServer => {
  const server = new McpServer(
    { name: 'handoff', version: MCP_SERVER_VERSION },
    {
      instructions:
        'Design-system knowledge for this project. Before writing UI code, find an existing component ' +
        'with handoff_search_components and read it with handoff_get_component. Take colors, typography ' +
        'and spacing from handoff_get_tokens instead of inventing values. Search documentation with ' +
        'handoff_search_pages and read a page with handoff_get_page.',
    }
  );

  registerComponentTools(server);
  registerTokenTools(server);
  registerPageTools(server);
  return server;
};
