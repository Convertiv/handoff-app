import type { NextApiRequest, NextApiResponse } from 'next';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { getRegistryConnection, RegistryConnectionError } from '../registry-connection';
import { authorizeMutation } from './auth';
import { sendRegistryError } from './errors';
import { buildMeta, type RegistryMeta } from './meta';
import { redactSecrets } from './redact';

/**
 * Shared orchestration for every `/api/registry/*` route (technical design §9/§12).
 *
 * Enforces, in order: the registry-runtime guard (management APIs exist only when
 * `runtime.mode: registry`, else `409 runtime_mode_conflict`); the per-route method allowlist
 * (`405 method_not_allowed`); the bearer-token guard for mutations (`503 token_not_configured` /
 * `401 unauthorized`); and database resolution (`503 database_unavailable`). The route body then
 * runs against a live connection, with any thrown failure mapped to `unexpected_error`.
 */

/** Methods that mutate state and therefore require the bearer token. */
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Context handed to a registry route body once all guards pass. */
export interface RegistryRouteContext {
  req: NextApiRequest;
  res: NextApiResponse;
  db: RegistryDatabase;
  method: string;
}

/**
 * Guard that the active runtime is `registry`. Writes `409 runtime_mode_conflict` and returns
 * `false` in workspace mode. Used by routes (like health) that do not need a database connection.
 */
export const ensureRegistryMode = (req: NextApiRequest, res: NextApiResponse): boolean => {
  if (getServerRuntimeConfig().mode === 'registry') {
    return true;
  }
  sendRegistryError(
    res,
    'runtime_mode_conflict',
    'The registry management API is available only when runtime.mode is "registry".'
  );
  return false;
};

/** Write a successful registry API response with the `{ data, meta }` envelope (data redacted). */
export const sendRegistryData = (
  res: NextApiResponse,
  status: number,
  data: unknown,
  meta: RegistryMeta = buildMeta()
): void => {
  res.status(status).json({ data: redactSecrets(data), meta });
};

/**
 * Run a registry route body behind the full guard stack. `methods` is the route's allowlist (e.g.
 * `['GET', 'POST']`); the body branches on `ctx.method`.
 */
export const handleRegistryRoute = async (
  req: NextApiRequest,
  res: NextApiResponse,
  methods: string[],
  body: (ctx: RegistryRouteContext) => Promise<void>
): Promise<void> => {
  if (!ensureRegistryMode(req, res)) {
    return;
  }

  const method = (req.method ?? 'GET').toUpperCase();
  if (!methods.includes(method)) {
    res.setHeader('Allow', methods.join(', '));
    sendRegistryError(res, 'method_not_allowed', `Method ${method} not allowed for this registry endpoint.`);
    return;
  }

  if (MUTATION_METHODS.has(method)) {
    const auth = authorizeMutation(req);
    if (!auth.ok) {
      sendRegistryError(res, auth.code, auth.message);
      return;
    }
  }

  let db: RegistryDatabase;
  try {
    ({ db } = await getRegistryConnection());
  } catch (error) {
    if (error instanceof RegistryConnectionError) {
      sendRegistryError(res, 'database_unavailable', error.message);
      return;
    }
    sendRegistryError(res, 'unexpected_error', error instanceof Error ? error.message : 'Unexpected registry API error.');
    return;
  }

  try {
    await body({ req, res, db, method });
  } catch (error) {
    sendRegistryError(res, 'unexpected_error', error instanceof Error ? error.message : 'Unexpected registry API error.');
  }
};
