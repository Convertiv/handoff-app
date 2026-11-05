import type { NextApiRequest, NextApiResponse } from 'next';
import { isRegistryTokenPrincipal, REGISTRY_READ_SCOPE } from '@handoff/registry/auth';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { getRegistryConnection, RegistryConnectionError } from '../registry-connection';
import { authorizeRegistryRequest } from '../registry-api/auth';
import type { McpPrincipal } from './tool';

/**
 * Read authorization for the MCP endpoint.
 *
 * Workspace mode is open, since a local docs app has no credential to present. Registry mode wants a
 * token carrying `registry:read`, presented the way the rest of the registry API takes it
 * (`Authorization: Bearer` or `X-Handoff-Api-Key`).
 *
 * This check authorizes reading only. Each tool that writes checks its own scope per call.
 */

/** JSON-RPC error codes this guard can produce, keyed by HTTP status. */
const JSONRPC_CODE_BY_STATUS: Record<number, number> = {
  400: -32600,
  401: -32001,
  403: -32003,
  503: -32003,
};

/**
 * Write a JSON-RPC failure. The request never reaches the transport, so the envelope is built by
 * hand; `id: null` is what a client expects when the failure cannot be tied to a request.
 */
const sendMcpError = (res: NextApiResponse, status: number, message: string): void => {
  res.status(status).json({ jsonrpc: '2.0', error: { code: JSONRPC_CODE_BY_STATUS[status] ?? -32603, message }, id: null });
};

const STATUS_BY_CODE: Record<string, number> = { bad_request: 400, unauthorized: 401, forbidden: 403 };

/**
 * Authorize an MCP request. Returns `null` once a failure response has been written, and runs before
 * the server is built so a rejected caller never reaches a tool handler.
 */
export const authorizeMcpRequest = async (req: NextApiRequest, res: NextApiResponse): Promise<{ principal: McpPrincipal } | null> => {
  if (getServerRuntimeConfig().mode !== 'registry') {
    return { principal: null };
  }

  try {
    const { db } = await getRegistryConnection();
    const auth = await authorizeRegistryRequest(req, db, REGISTRY_READ_SCOPE);
    if (!auth.ok) {
      sendMcpError(res, STATUS_BY_CODE[auth.code!] ?? 401, auth.message!);
      return null;
    }
    const principal = auth.principal!;
    return {
      principal: isRegistryTokenPrincipal(principal) ? { userId: principal.userId, role: principal.role, scopes: principal.scopes } : null,
    };
  } catch (error) {
    if (error instanceof RegistryConnectionError) {
      sendMcpError(res, 503, error.message);
      return null;
    }
    console.error('MCP authorization failed.', error);
    sendMcpError(res, 500, 'Unexpected MCP authorization error.');
    return null;
  }
};
