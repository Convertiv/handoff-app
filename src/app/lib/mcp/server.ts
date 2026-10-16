import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { componentTools } from './components';
import { pageTools } from './pages';
import { fail } from './result';
import { tokenTools } from './tokens';

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

const tools = [...componentTools, ...tokenTools, ...pageTools];

/** Compiled once per process, not per request. */
const validator = new AjvJsonSchemaValidator();
const toolsByName = new Map(
  tools.map((tool) => [tool.definition.name, { ...tool, validate: validator.getValidator(tool.definition.inputSchema) }])
);

export const createMcpServer = (): Server => {
  const server = new Server(
    { name: 'handoff', version: MCP_SERVER_VERSION },
    {
      capabilities: { tools: {} },
      instructions:
        'Design-system knowledge for this project. Before writing UI code, find an existing component ' +
        'with handoff_search_components and read it with handoff_get_component. Take colors, typography ' +
        'and spacing from handoff_get_tokens instead of inventing values. Search documentation with ' +
        'handoff_search_pages and read a page with handoff_get_page.',
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: tools.map((tool) => tool.definition) }));

  // Unknown tools and invalid arguments are tool errors, so the agent can read them and retry.
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const tool = toolsByName.get(params.name);
    if (!tool) {
      return fail(`Tool "${params.name}" was not found.`);
    }
    const args = tool.validate(params.arguments ?? {});
    if (!args.valid) {
      return fail(`Invalid arguments for tool "${params.name}": ${args.errorMessage}.`);
    }
    return tool.run(args.data);
  });

  return server;
};
