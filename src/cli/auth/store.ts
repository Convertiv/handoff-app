import fs from 'fs-extra';
import path from 'path';

/** Credentials issued to this workspace by one registry. */
export interface CliAuth {
  remoteUrl: string;
  accessToken: string;
  /** Epoch milliseconds after which the token must not be used. */
  expiresAtMs: number;
}

const AUTH_DIRECTORY = '.handoff';
const AUTH_FILE = 'cli-auth.json';

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

export const cliAuthFilePath = (workingPath: string): string => path.resolve(workingPath, AUTH_DIRECTORY, AUTH_FILE);

const isCliAuth = (value: unknown): value is CliAuth => {
  if (!value || typeof value !== 'object') return false;
  const auth = value as Partial<CliAuth>;
  return (
    typeof auth.remoteUrl === 'string' &&
    typeof auth.accessToken === 'string' &&
    auth.accessToken.length > 0 &&
    typeof auth.expiresAtMs === 'number' &&
    Number.isFinite(auth.expiresAtMs)
  );
};

/** Invalid or partial credential files are treated as unauthenticated. */
export const readCliAuth = async (workingPath: string): Promise<CliAuth | null> => {
  try {
    const value = (await fs.readJson(cliAuthFilePath(workingPath))) as unknown;
    if (!isCliAuth(value)) return null;
    return { ...value, remoteUrl: normalizeRegistryUrl(value.remoteUrl) };
  } catch {
    return null;
  }
};

/**
 * Atomically replace the credential file. Restrictive permissions are best-effort on platforms
 * whose filesystems do not support POSIX modes.
 */
export const writeCliAuth = async (workingPath: string, auth: CliAuth): Promise<void> => {
  const filePath = cliAuthFilePath(workingPath);
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const value: CliAuth = { ...auth, remoteUrl: normalizeRegistryUrl(auth.remoteUrl) };

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

export const clearCliAuth = async (workingPath: string): Promise<void> => {
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
