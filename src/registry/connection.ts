/**
 * Connected-workspace registry connection resolution.
 *
 * A connected workspace is `runtime.mode: 'workspace'` plus a `runtime.registryConnection` block
 * pointing at a remote registry — it is not a third runtime mode. The connection is resolved from
 * config + environment: the registry URL may be given inline or via an env-var *name*, and the
 * access token is always read from an env-var name (never persisted as a value). This is the single
 * source the publish (and later checkout) client reads its target + credentials from.
 */

import type { Config } from '../types/config';
import { cliAuthMatchesRegistry, cliAuthTokenIsValid, readCliAuth } from '../cli/auth/store';
// Imported straight from the module, not the `auth` barrel, to keep the database schema off the CLI
// startup path; this file is resolved for every command.
import { resolveRegistrySyncSecret } from './auth/sync-secret';

/** Default env-var name holding the remote registry base URL. */
export const DEFAULT_REGISTRY_URL_ENV = 'HANDOFF_REGISTRY_URL';

/** Default env-var name holding the connected-workspace access token. */
export const DEFAULT_REGISTRY_ACCESS_TOKEN_ENV = 'HANDOFF_REGISTRY_ACCESS_TOKEN';

/** Fully resolved connected-workspace registry connection. */
export interface ResolvedRegistryConnection {
  /** Resolved registry base URL (inline config value wins, else the named env var), or `''`. */
  url: string;
  /** Resolved access token value (from the named env var), or `''`. */
  accessToken: string;
  /** Name of the env var the URL falls back to. */
  urlEnv: string;
  /** Name of the env var the access token is read from. */
  accessTokenEnv: string;
}

/**
 * Resolve the connected-workspace registry connection from config + environment. Never throws —
 * Callers inspect the resolved URL and access token to surface specific configuration errors.
 */
export const resolveRegistryConnection = (config: Config | null | undefined): ResolvedRegistryConnection => {
  const connection = config?.runtime?.registryConnection;
  const urlEnv = connection?.urlEnv?.trim() || DEFAULT_REGISTRY_URL_ENV;
  const accessTokenEnv = connection?.accessTokenEnv?.trim() || DEFAULT_REGISTRY_ACCESS_TOKEN_ENV;

  const inlineUrl = connection?.url?.trim();
  const url = (inlineUrl || process.env[urlEnv]?.trim()) ?? '';
  const accessToken = process.env[accessTokenEnv]?.trim() ?? '';

  return {
    url,
    accessToken,
    urlEnv,
    accessTokenEnv,
  };
};

/**
 * Resolve the same connection for an authenticated CLI operation, letting a saved device login fill
 * in what the environment does not provide. A valid login supplies both the registry URL and the
 * access token, so `handoff-app login` alone is enough to publish and checkout. Environment values
 * keep precedence for deterministic CI: `HANDOFF_REGISTRY_URL` (or inline config) wins over the
 * saved URL, and `HANDOFF_REGISTRY_ACCESS_TOKEN` wins over the saved token. The saved token only
 * applies to the URL it was issued for.
 *
 * A configured `HANDOFF_SYNC_SECRET` is the last resort. Being deployment-wide rather than personal,
 * it fills in only where there is no explicit token and no login (CI, in practice), instead of quietly
 * speaking for a developer who is signed in.
 */
export const resolveAuthenticatedRegistryConnection = async (
  config: Config | null | undefined,
  workingPath = process.cwd()
): Promise<ResolvedRegistryConnection> => {
  const connection = resolveRegistryConnection(config);

  const auth = await readCliAuth(workingPath);
  const login = cliAuthTokenIsValid(auth) ? auth! : null;

  const url = connection.url || login?.remoteUrl || '';
  const savedToken = login && cliAuthMatchesRegistry(login, url) ? login.accessToken : '';
  const accessToken = connection.accessToken || savedToken || resolveRegistrySyncSecret();
  return { ...connection, url, accessToken };
};
