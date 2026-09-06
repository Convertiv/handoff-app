import type { NextApiRequest, NextApiResponse } from 'next';
import { REGISTRY_READ_SCOPE } from '@handoff/registry/auth';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { getRegistryConnection, RegistryConnectionError } from '../registry-connection';
import { authorizeRegistryRequest } from '../registry-api/auth';

/**
 * Read authorization for the MCP endpoint.
 *
 * Workspace mode is open, since a local docs app has no credential to present. Registry mode wants a
 * token carrying `registry:read`, presented the way the rest of the registry API takes it
 * (`Authorization: Bearer` or `X-Handoff-Api-Key`).
 *
 * This is one check per request against a fixed scope, so it only holds while every tool is
 * read-only: it authorizes the request, not the individual call, and a single POST can carry a batch
 * of calls. Adding a tool that writes means resolving the principal here and having each tool assert
 * the scope it needs, otherwise the write is reachable with a read-only token.
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
 * Authorize an MCP request. Returns `false` once a failure response has been written, and runs
 * before the server is built so a rejected caller never reaches a tool handler.
 */
export const authorizeMcpRequest = async (req: NextApiRequest, res: NextApiResponse): Promise<boolean> => {
  if (getServerRuntimeConfig().mode !== 'registry') {
    return true;
  }

  try {
    const { db } = await getRegistryConnection();
    const auth = await authorizeRegistryRequest(req, db, REGISTRY_READ_SCOPE);
    if (!auth.ok) {
      sendMcpError(res, STATUS_BY_CODE[auth.code!] ?? 401, auth.message!);
      return false;
    }
    return true;
  } catch (error) {
    if (error instanceof RegistryConnectionError) {
      sendMcpError(res, 503, error.message);
      return false;
    }
    console.error('MCP authorization failed.', error);
    sendMcpError(res, 500, 'Unexpected MCP authorization error.');
    return false;
  }
};
