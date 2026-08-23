import type { NextApiRequest, NextApiResponse } from 'next';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import type { RegistryPrincipal } from '@handoff/registry/auth';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { getRegistryConnection, RegistryConnectionError } from '../registry-connection';
import { authorizeRegistryRequest, requiredScopeForMethod } from './auth';
import { sendRegistryError } from './errors';
import { buildMeta, type RegistryMeta } from './meta';
import { redactSecrets } from '../api/redact';

/**
 * Shared orchestration for every `/api/registry/*` route.
 *
 * Enforces, in order: the registry-runtime guard (management APIs exist only when
 * `runtime.mode: registry`, else `409 runtime_mode_conflict`); the per-route method allowlist
 * (`405 method_not_allowed`); database resolution (`503 database_unavailable`); and scoped credential
 * authorization on every request: reads require `registry:read`, mutations require `registry:write`
 * (`400 bad_request` / `401 unauthorized` / `403 forbidden`). The route body then runs against a live
 * connection, with any thrown failure mapped to `unexpected_error`.
 *
 * The database is resolved before authorization because that is the only guard needing a connection,
 * so a request that would fail auth against a registry with a down database reports
 * `database_unavailable` first.
 */

/** Context handed to a registry route body once all guards pass. */
export interface RegistryRouteContext {
  req: NextApiRequest;
  res: NextApiResponse;
  db: RegistryDatabase;
  method: string;
  /** Authenticated caller; every request that reaches a route body is authorized. */
  principal: RegistryPrincipal;
}

/**
 * Guard that the active runtime is `registry`. Writes `409 runtime_mode_conflict` and returns
 * `false` in workspace mode. Used by routes (like health) that do not need a database connection.
 */
export const ensureRegistryMode = (res: NextApiResponse): boolean => {
  if (getServerRuntimeConfig().mode === 'registry') {
    return true;
  }
  sendRegistryError(res, 'runtime_mode_conflict', 'The registry management API is available only when runtime.mode is "registry".');
  return false;
};

/** Write a successful registry API response with the `{ data, meta }` envelope (data redacted). */
export const sendRegistryData = (res: NextApiResponse, status: number, data: unknown, meta: RegistryMeta = buildMeta()): void => {
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
  if (!ensureRegistryMode(res)) {
    return;
  }

  const method = (req.method ?? 'GET').toUpperCase();
  if (!methods.includes(method)) {
    res.setHeader('Allow', methods.join(', '));
    sendRegistryError(res, 'method_not_allowed', `Method ${method} not allowed for this registry endpoint.`);
    return;
  }

  let db: RegistryDatabase;
  try {
    ({ db } = await getRegistryConnection());
  } catch (error) {
    if (error instanceof RegistryConnectionError) {
      sendRegistryError(res, 'database_unavailable', error.message);
      return;
    }
    console.error('Registry connection resolution failed.', error);
    sendRegistryError(res, 'unexpected_error', 'Unexpected registry API error.');
    return;
  }

  const auth = await authorizeRegistryRequest(req, db, requiredScopeForMethod(method));
  if (!auth.ok) {
    sendRegistryError(res, auth.code!, auth.message!);
    return;
  }
  const principal = auth.principal!;

  try {
    await body({ req, res, db, method, principal });
  } catch (error) {
    console.error('Registry API request failed.', error);
    sendRegistryError(res, 'unexpected_error', 'Unexpected registry API error.');
  }
};
