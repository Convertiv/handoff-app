import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { dynamicTool, jsonSchema, type ToolSet } from 'ai';
import { createMcpServer } from '../mcp';

/**
 * The assistant's tools: the MCP server's own tools, reached in process.
 *
 * The chat route connects a client to {@link createMcpServer} over a linked in-memory transport
 * pair rather than calling `/api/mcp/` over HTTP. In registry mode that endpoint demands a
 * `registry:read` bearer token while the browser holds a session cookie, so the server would have
 * to mint a token to call itself, and the HTTP hop is needless inside one function either way.
 *
 * A tool added to the MCP server therefore reaches the assistant with no further work here.
 */

/** A page or component a tool read, surfaced to the reader as a link under the answer. */
export interface AiSource {
  url: string;
  title: string;
}

export interface AiToolSession {
  tools: ToolSet;
  close: () => Promise<void>;
}

/** Docs route for one component id. Patterns and pages carry their own paths. */
const componentUrl = (id: string): string => `/system/component/${encodeURIComponent(id)}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const text = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

/**
 * The pages and components behind one tool result, so the answer can link to what it was read from.
 * Only the shapes `./shape` produces are recognized; anything else contributes no source, which
 * costs a link rather than breaking the answer.
 */
const sourcesOf = (toolName: string, payload: unknown): AiSource[] => {
  const record = asRecord(payload);
  if (!record) return [];

  if (toolName === 'handoff_get_component') {
    const id = text(record.id);
    return id ? [{ url: componentUrl(id), title: text(record.title) ?? id }] : [];
  }
  // A preview links to the component's docs page, which is where a reader sees it rendered.
  if (toolName === 'handoff_get_component_preview') {
    const component = asRecord(record.component);
    const id = component && text(component.id);
    return id ? [{ url: componentUrl(id), title: text(component.title) ?? id }] : [];
  }
  if (toolName === 'handoff_get_page') {
    const url = text(record.url);
    return url ? [{ url, title: text(record.title) ?? url }] : [];
  }
  if (toolName === 'handoff_search_pages') {
    const results = Array.isArray(record.results) ? record.results : [];
    return results.flatMap((entry) => {
      const page = asRecord(entry);
      const url = page && text(page.url);
      return url ? [{ url, title: text(page.title) ?? url }] : [];
    });
  }
  return [];
};

/** Parse the single JSON text block an MCP tool returns. */
const parseToolPayload = (result: CallToolResult): unknown => {
  const block = result.content?.find((entry) => entry.type === 'text');
  if (!block || block.type !== 'text') return null;
  try {
    return JSON.parse(block.text);
  } catch {
    return null;
  }
};

/**
 * Build the tool set for one request. Tool descriptions and input schemas come from the MCP server
 * itself, so the agent sees what any other MCP client would.
 *
 * @param onSources - Called with the pages and components each tool read, as they are read.
 */
export const createAiToolSession = async (onSources: (sources: AiSource[]) => void): Promise<AiToolSession> => {
  const server = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'handoff-docs-assistant', version: '1.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const { tools: definitions } = await client.listTools();
  const tools: ToolSet = Object.fromEntries(
    definitions.map((definition) => [
      definition.name,
      dynamicTool({
        description: definition.description,
        inputSchema: jsonSchema(definition.inputSchema as Parameters<typeof jsonSchema>[0]),
        execute: async (input) => {
          const result = (await client.callTool({
            name: definition.name,
            arguments: (asRecord(input) ?? {}) as Record<string, unknown>,
          })) as CallToolResult;
          if (!result.isError) onSources(sourcesOf(definition.name, parseToolPayload(result)));
          return result.content;
        },
      }),
    ])
  );

  return {
    tools,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
};
