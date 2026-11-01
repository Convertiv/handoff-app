import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type { RegistryAccessScope, RegistryUserRole } from '@handoff/registry/auth';

/** `null` in a workspace and for a credential that is not a user's (the deployment sync secret). */
export type McpPrincipal = {
  userId: string;
  role: RegistryUserRole;
  scopes: readonly RegistryAccessScope[];
} | null;

export interface McpToolContext {
  principal: McpPrincipal;
}

/**
 * One MCP tool: its listing, with a plain JSON Schema for its input, and its handler.
 *
 * Plain JSON Schema keeps Zod out of the app. The Next build type-checks this code against the
 * consumer's `node_modules`, where a second Zod copy makes the SDK's Zod types incompatible with ours.
 */
export interface McpTool {
  definition: Tool;
  /** Runs with arguments already validated against `definition.inputSchema`. */
  run: (args: unknown, context: McpToolContext) => Promise<CallToolResult>;
  registryOnly?: boolean;
}

/** `Args` must match `definition.inputSchema`; the server validates against the schema before `run`. */
export const defineTool = <Args>(
  definition: Tool,
  run: (args: Args, context: McpToolContext) => Promise<CallToolResult>
): McpTool => ({
  definition,
  run: run as McpTool['run'],
});
