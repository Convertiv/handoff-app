/**
 * Connected-workspace registry connection resolution.
 *
 * A connected workspace is `runtime.mode: 'workspace'` plus a `runtime.registryConnection` block
 * pointing at a remote registry — it is not a third runtime mode. The connection is resolved from
 * config + environment: the registry URL may be given inline or via an env-var *name*, and the
 * access token is always read from an env-var name (never persisted as a value). This is the single
 * source the publish (and later checkout) client reads its target + credentials from.
 *
 * The older `HANDOFF_CLOUD_*` names still work as deprecated fallbacks; see
 * {@link DEPRECATED_ENV_ALIASES}.
 */

import type { Config } from '../types/config';
import { cliAuthMatchesRegistry, cliAuthTokenIsValid, readCliAuth } from '../cli/auth/store';
// Imported straight from the module, not the `auth` barrel, to keep the database schema off the CLI
// startup path; this file is resolved for every command.
import { resolveRegistrySyncSecret } from './auth/sync-secret';
import { Logger } from '../utils/logger';

/** Default env-var name holding the remote registry base URL. */
export const DEFAULT_REGISTRY_URL_ENV = 'HANDOFF_REGISTRY_URL';

/** Default env-var name holding the connected-workspace access token. */
export const DEFAULT_REGISTRY_ACCESS_TOKEN_ENV = 'HANDOFF_REGISTRY_ACCESS_TOKEN';

/**
 * Old env-var names we still read, keyed by the name that replaced them. Keeps workspaces set up
 * from the older docs working instead of silently reporting no registry.
 */
const DEPRECATED_ENV_ALIASES: Readonly<Record<string, string>> = {
  [DEFAULT_REGISTRY_URL_ENV]: 'HANDOFF_CLOUD_URL',
  [DEFAULT_REGISTRY_ACCESS_TOKEN_ENV]: 'HANDOFF_CLOUD_TOKEN',
};

/** Aliases we've already warned about, so each one warns once per run and not once per lookup. */
const warnedAliases = new Set<string>();

/**
 * Value of the named env var, falling back to its deprecated alias. Only the default names have
 * aliases: a custom `urlEnv`/`accessTokenEnv` is a deliberate choice, so a stray `HANDOFF_CLOUD_*`
 * must not stand in for it. The warning goes through {@link Logger.warn}, so
 * `HANDOFF_LOG_LEVEL=error` silences it in CI.
 */
const readConnectionEnv = (name: string): string => {
  const configured = process.env[name]?.trim();
  if (configured) return configured;

  const alias = DEPRECATED_ENV_ALIASES[name];
  const inherited = alias ? process.env[alias]?.trim() : '';
  if (!inherited) return '';

  if (!warnedAliases.has(alias)) {
    warnedAliases.add(alias);
    Logger.warn(`${alias} is deprecated and will be removed in a future release; set ${name} instead.`);
  }
  return inherited;
};

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
 *
 * `urlEnv` and `accessTokenEnv` always report the canonical name, even when an alias supplied the
 * value, so errors built from them point at the variable to adopt.
 */
export const resolveRegistryConnection = (config: Config | null | undefined): ResolvedRegistryConnection => {
  const connection = config?.runtime?.registryConnection;
  const urlEnv = connection?.urlEnv?.trim() || DEFAULT_REGISTRY_URL_ENV;
  const accessTokenEnv = connection?.accessTokenEnv?.trim() || DEFAULT_REGISTRY_ACCESS_TOKEN_ENV;

  const inlineUrl = connection?.url?.trim();
  const url = inlineUrl || readConnectionEnv(urlEnv);
  const accessToken = readConnectionEnv(accessTokenEnv);

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
