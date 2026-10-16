import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * One MCP tool: its listing, with a plain JSON Schema for its input, and its handler.
 *
 * Plain JSON Schema keeps Zod out of the app. The Next build type-checks this code against the
 * consumer's `node_modules`, where a second Zod copy makes the SDK's Zod types incompatible with ours.
 */
export interface McpTool {
  definition: Tool;
  /** Runs with arguments already validated against `definition.inputSchema`. */
  run: (args: unknown) => Promise<CallToolResult>;
}

/** `Args` must match `definition.inputSchema`; the server validates against the schema before `run`. */
export const defineTool = <Args>(definition: Tool, run: (args: Args) => Promise<CallToolResult>): McpTool => ({
  definition,
  run: run as McpTool['run'],
});
