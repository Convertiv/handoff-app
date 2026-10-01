import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { resolveDocsBackend } from '../docs-api';
import type { DocsBackend } from '../docs-api/backend';

/** Result helpers shared by every tool. */

/** Base path the docs app is mounted under, so emitted preview URLs are actually fetchable. */
export const basePath = (): string => process.env.HANDOFF_APP_BASE_PATH ?? '';

/**
 * A successful tool result: one compact JSON text block, since indentation only costs the agent
 * tokens. A tool only ever returns design-system content read through {@link resolveDocsBackend}, so
 * there is nothing here to withhold from a caller already authorized to read it.
 */
export const ok = (data: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data) }],
});

/** A failed tool result. Not-found and bad-argument are tool errors, not protocol errors. */
export const fail = (message: string): CallToolResult => ({ isError: true, content: [{ type: 'text', text: message }] });

/**
 * Run a tool body, turning an unexpected read failure into a safe message. The cause is logged
 * server-side and never returned, matching the docs read API's `unexpected_error`.
 */
export const read = async (what: string, body: (backend: DocsBackend) => Promise<CallToolResult>): Promise<CallToolResult> => {
  try {
    return await body(await resolveDocsBackend());
  } catch (error) {
    console.error(`MCP read failed: ${what}.`, error);
    return fail(`Unable to read ${what}.`);
  }
};
