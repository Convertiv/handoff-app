/**
 * Registry connection values resolve at config load. Saved device login credentials can fill
 * missing values for CLI operations; neither source is persisted in the app's client config.
 */

import { configEnvName } from '../config/resolve-env';
import type { ResolvedConfig } from '../types/config';
import { type CliAuth, cliAuthMatchesRegistry, cliAuthTokenIsValid, DEFAULT_LOGIN_PROFILE, readCliAuth } from '../cli/auth/store';
// Imported straight from the module, not the `auth` barrel, to keep the database schema off the CLI
// startup path; this file is resolved for every command.
import { resolveRegistrySyncSecret } from './auth/sync-secret';

/** Default env-var name holding the remote registry base URL. */
export const DEFAULT_REGISTRY_URL_ENV = 'HANDOFF_REGISTRY_URL';

/** Default env-var name holding the connected-workspace access token. */
export const DEFAULT_REGISTRY_ACCESS_TOKEN_ENV = 'HANDOFF_REGISTRY_ACCESS_TOKEN';

/** A saved login and the profile it is stored under, which is not always the selected profile. */
interface SavedLogin {
  profile: string;
  url: string;
}

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
  /** Profile the saved login was looked up under. */
  loginProfile: string;
  /** Set when a saved login was skipped because it was issued for another registry. */
  unmatchedLogin?: SavedLogin;
}

/** Read values resolved at config load, retaining variable names for CLI diagnostics. */
export const resolveRegistryConnection = (config: ResolvedConfig | null | undefined): ResolvedRegistryConnection => {
  const connection = config?.runtime?.registryConnection;
  const urlEnv = configEnvName(config, 'runtime.registryConnection.url') || DEFAULT_REGISTRY_URL_ENV;
  const accessTokenEnv = configEnvName(config, 'runtime.registryConnection.accessToken') || DEFAULT_REGISTRY_ACCESS_TOKEN_ENV;
  const url = connection?.url?.trim() || '';
  const accessToken = connection?.accessToken?.trim() || '';

  return {
    url,
    accessToken,
    urlEnv,
    accessTokenEnv,
    loginProfile: DEFAULT_LOGIN_PROFILE,
  };
};

/**
 * The valid login to use for a profile. A profile without its own login falls back to the default
 * login, so a workspace that names profiles for other reasons keeps working after one plain
 * `handoff-app login`. The fallback is safe because a token is only ever used for the registry URL
 * it was issued for.
 */
const readProfileLogin = async (workingPath: string, profile: string): Promise<{ auth: CliAuth; profile: string } | null> => {
  const own = await readCliAuth(workingPath, profile);
  if (cliAuthTokenIsValid(own)) return { auth: own!, profile };

  const fallback = profile === DEFAULT_LOGIN_PROFILE ? null : await readCliAuth(workingPath);
  return cliAuthTokenIsValid(fallback) ? { auth: fallback!, profile: DEFAULT_LOGIN_PROFILE } : null;
};

/**
 * Resolve the same connection for an authenticated CLI operation, letting a saved device login fill
 * in what the environment does not provide. A valid login supplies both the registry URL and the
 * access token, so `handoff-app login` alone is enough to publish and checkout. The login is the one
 * saved under the selected profile, which is how one workspace addresses several registries.
 * Environment values keep precedence for deterministic CI: `HANDOFF_REGISTRY_URL` (or inline config)
 * wins over the saved URL, and `HANDOFF_REGISTRY_ACCESS_TOKEN` wins over the saved token. The saved
 * token only applies to the URL it was issued for.
 *
 * A configured `HANDOFF_SYNC_SECRET` is the last resort. Being deployment-wide rather than personal,
 * it fills in only where there is no explicit token and no login (CI, in practice), instead of quietly
 * speaking for a developer who is signed in.
 */
export const resolveAuthenticatedRegistryConnection = async (
  config: ResolvedConfig | null | undefined,
  workingPath = process.cwd(),
  profile?: string
): Promise<ResolvedRegistryConnection> => {
  const connection = resolveRegistryConnection(config);
  const loginProfile = profile?.trim() || DEFAULT_LOGIN_PROFILE;

  const login = await readProfileLogin(workingPath, loginProfile);
  const url = connection.url || login?.auth.remoteUrl || '';
  const matches = Boolean(login) && cliAuthMatchesRegistry(login!.auth, url);
  const accessToken = connection.accessToken || (matches ? login!.auth.accessToken : '') || resolveRegistrySyncSecret();

  return {
    ...connection,
    url,
    accessToken,
    loginProfile,
    unmatchedLogin: login && !matches ? { profile: login.profile, url: login.auth.remoteUrl } : undefined,
  };
};

/** The `handoff-app login` call that would authorize this connection, naming the selected profile. */
export const loginCommandHint = (connection: ResolvedRegistryConnection): string =>
  [
    'handoff-app login',
    connection.loginProfile === DEFAULT_LOGIN_PROFILE ? '' : ` --profile ${connection.loginProfile}`,
    ` --url ${connection.url || '<registry-url>'}`,
  ].join('');

/**
 * Names a saved login that was skipped because it belongs to another registry. Without it, a run
 * that resolves its URL from the environment reports a missing token while a login is in place.
 */
export const unusedLoginNote = (connection: ResolvedRegistryConnection): string =>
  connection.unmatchedLogin
    ? ` The login saved for profile "${connection.unmatchedLogin.profile}" is for ${connection.unmatchedLogin.url}, not ${connection.url}.`
    : '';
