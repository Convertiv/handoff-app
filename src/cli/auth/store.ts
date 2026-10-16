import fs from 'fs-extra';
import path from 'path';

/** Credentials issued to this workspace by one registry. */
export interface CliAuth {
  remoteUrl: string;
  accessToken: string;
  /** Epoch milliseconds after which the token must not be used. */
  expiresAtMs: number;
}

/** Name a login is saved under when no profile is selected. */
export const DEFAULT_LOGIN_PROFILE = 'default';

const AUTH_DIRECTORY = '.handoff';
const AUTH_FILE = 'cli-auth.json';

/** The credential file: one login per profile name, so a workspace can hold several registries. */
interface CliAuthFile {
  logins: Record<string, CliAuth>;
}

/**
 * Canonicalize a registry URL for both HTTP requests and exact credential matching.
 * Base paths are retained; query strings, fragments, credentials, and trailing slashes are not.
 */
export const normalizeRegistryUrl = (value: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(`Invalid registry URL "${value}". Pass an absolute http:// or https:// URL.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid registry URL protocol "${parsed.protocol}". Use http:// or https://.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error('Registry URLs must not contain credentials.');
  }

  const pathname = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${pathname === '/' ? '' : pathname}`;
};

/**
 * A verification URL is only trustworthy if it's a web URL on the same origin as the
 * registry the CLI is authenticating against. This stops a tampered device-authorization
 * response from sending the browser to (or injecting a command via) another origin.
 */
export const assertRegistryOriginUrl = (baseUrl: string, candidate: string): string => {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('The registry returned an invalid verification URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`The registry returned a verification URL with an unsupported protocol "${url.protocol}".`);
  }
  if (url.origin !== new URL(baseUrl).origin) {
    throw new Error('The registry returned a verification URL for a different origin than the registry.');
  }
  return url.toString();
};

export const cliAuthFilePath = (workingPath: string): string => path.resolve(workingPath, AUTH_DIRECTORY, AUTH_FILE);

/** An invalid or partial entry reads as no login, so one bad entry cannot hide the others. */
const toCliAuth = (value: unknown): CliAuth | null => {
  if (!value || typeof value !== 'object') return null;
  const auth = value as Partial<CliAuth>;
  if (typeof auth.remoteUrl !== 'string') return null;
  if (typeof auth.accessToken !== 'string' || auth.accessToken.length === 0) return null;
  if (typeof auth.expiresAtMs !== 'number' || !Number.isFinite(auth.expiresAtMs)) return null;

  try {
    return { remoteUrl: normalizeRegistryUrl(auth.remoteUrl), accessToken: auth.accessToken, expiresAtMs: auth.expiresAtMs };
  } catch {
    return null;
  }
};

const toLogins = (value: unknown): Record<string, CliAuth> => {
  const logins = (value as Partial<CliAuthFile> | null)?.logins;
  if (!logins || typeof logins !== 'object') return {};

  const result: Record<string, CliAuth> = {};
  for (const [profile, entry] of Object.entries(logins as Record<string, unknown>)) {
    const auth = toCliAuth(entry);
    if (auth) result[profile] = auth;
  }
  return result;
};

/** Every saved login, keyed by profile name. A missing or unreadable file reads as no logins. */
export const readCliLogins = async (workingPath: string): Promise<Record<string, CliAuth>> => {
  try {
    return toLogins((await fs.readJson(cliAuthFilePath(workingPath))) as unknown);
  } catch {
    return {};
  }
};

/** The login saved under one profile name. Never falls back to another profile. */
export const readCliAuth = async (workingPath: string, profile: string = DEFAULT_LOGIN_PROFILE): Promise<CliAuth | null> =>
  (await readCliLogins(workingPath))[profile] ?? null;

/**
 * Profile names that have a saved login. Synchronous because config loading is, and the loader needs
 * these names to decide whether a selected profile resolves.
 */
export const loginProfileNames = (workingPath: string): string[] => {
  try {
    return Object.keys(toLogins(fs.readJsonSync(cliAuthFilePath(workingPath)) as unknown));
  } catch {
    return [];
  }
};

/**
 * Atomically replace the credential file. Restrictive permissions are best-effort on platforms
 * whose filesystems do not support POSIX modes.
 */
const writeCliLogins = async (workingPath: string, logins: Record<string, CliAuth>): Promise<void> => {
  const filePath = cliAuthFilePath(workingPath);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const value: CliAuthFile = { logins };

  await fs.ensureDir(directory, 0o700);
  try {
    await fs.chmod(directory, 0o700);
  } catch {
    // Windows and some mounted filesystems do not implement POSIX modes.
  }

  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    try {
      await fs.chmod(temporaryPath, 0o600);
    } catch {
      // Best effort; see the directory chmod above.
    }
    await fs.rename(temporaryPath, filePath);
    try {
      await fs.chmod(filePath, 0o600);
    } catch {
      // Best effort.
    }
  } catch (error) {
    await fs.remove(temporaryPath).catch(() => undefined);
    throw error;
  }
};

/** Save the login for one profile and leave the other profiles in place. */
export const writeCliAuth = async (workingPath: string, auth: CliAuth, profile: string = DEFAULT_LOGIN_PROFILE): Promise<void> => {
  const logins = await readCliLogins(workingPath);
  logins[profile] = { ...auth, remoteUrl: normalizeRegistryUrl(auth.remoteUrl) };
  await writeCliLogins(workingPath, logins);
};

/** Remove the login for one profile, and the file itself once no login is left. */
export const clearCliAuth = async (workingPath: string, profile: string = DEFAULT_LOGIN_PROFILE): Promise<void> => {
  const logins = await readCliLogins(workingPath);
  delete logins[profile];

  if (Object.keys(logins).length === 0) {
    await clearAllCliAuth(workingPath);
    return;
  }
  await writeCliLogins(workingPath, logins);
};

/** Remove every saved login. */
export const clearAllCliAuth = async (workingPath: string): Promise<void> => {
  const filePath = cliAuthFilePath(workingPath);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
};

export const cliAuthMatchesRegistry = (auth: CliAuth | null, remoteUrl: string): boolean => {
  if (!auth) return false;
  try {
    return auth.remoteUrl === normalizeRegistryUrl(remoteUrl);
  } catch {
    return false;
  }
};

export const cliAuthTokenIsValid = (auth: CliAuth | null, skewMs = 30_000): boolean =>
  Boolean(auth?.accessToken && auth.expiresAtMs > Date.now() + skewMs);
