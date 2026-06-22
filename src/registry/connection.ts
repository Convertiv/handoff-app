/**
 * Connected-workspace registry connection resolution (technical design §1/§11, issue #13).
 *
 * A connected workspace is `runtime.mode: 'workspace'` plus a `runtime.registryConnection` block
 * pointing at a remote registry — it is not a third runtime mode. The connection is resolved from
 * config + environment: the registry URL may be given inline or via an env-var *name*, and the
 * access token is always read from an env-var name (never persisted as a value). This is the single
 * source the publish (and later checkout) client reads its target + credentials from.
 */

import type { Config } from '../types/config';

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
  /** Whether both a URL and a token are available. */
  isConfigured: boolean;
}

/**
 * Resolve the connected-workspace registry connection from config + environment. Never throws —
 * callers inspect `isConfigured` (and `url`/`accessToken`) to surface actionable, situation-specific
 * errors (missing URL vs missing token).
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
    isConfigured: Boolean(url && accessToken),
  };
};
