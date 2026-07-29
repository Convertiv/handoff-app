import { Logger } from '../../utils/logger';
import { tryOpenBrowser } from './browser';
import { assertRegistryOriginUrl, type CliAuth, normalizeRegistryUrl, writeCliAuth } from './store';

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const DEFAULT_DEVICE_EXPIRES_IN_SECONDS = 15 * 60;
const DEFAULT_TOKEN_EXPIRES_IN_SECONDS = 365 * 24 * 60 * 60;
const DEFAULT_POLL_INTERVAL_SECONDS = 5;

interface DeviceAuthorizationResponse {
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  expires_in?: number;
  interval?: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string | { code?: string; message?: string };
  error_description?: string;
}

interface Envelope<T> {
  data?: T;
  error?: string | { code?: string; message?: string };
}

export interface LoginOptions {
  openBrowser?: boolean;
}

const sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const responsePayload = <T>(value: T | Envelope<T>): T => {
  const envelope = value as Envelope<T>;
  return envelope && typeof envelope === 'object' && envelope.data ? envelope.data : (value as T);
};

const responseError = (value: unknown): { code?: string; message?: string } => {
  if (!value || typeof value !== 'object') return {};
  const body = value as TokenResponse;
  if (typeof body.error === 'string') {
    return { code: body.error, message: body.error_description || body.error };
  }
  if (body.error && typeof body.error === 'object') {
    return { code: body.error.code, message: body.error.message };
  }
  return {};
};

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
};

const shouldOpenBrowser = (options: LoginOptions): boolean => {
  if (options.openBrowser === false) return false;
  if (process.env.CI === '1' || process.env.CI === 'true') return false;
  return process.env.HANDOFF_LOGIN_NO_BROWSER !== '1' && process.env.HANDOFF_LOGIN_NO_BROWSER !== 'true';
};

const positiveNumberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

/** Complete the device grant and persist the one-time plaintext access token for this workspace. */
export const loginWithDevice = async (workingPath: string, remoteUrl: string, options: LoginOptions = {}): Promise<CliAuth> => {
  const baseUrl = normalizeRegistryUrl(remoteUrl);
  let deviceResponse: Response;
  try {
    deviceResponse = await fetch(`${baseUrl}/api/oauth/device`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (error) {
    throw new Error(`Could not reach the registry at ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const rawDevice = await readJson(deviceResponse);
  const device = responsePayload(rawDevice as DeviceAuthorizationResponse | Envelope<DeviceAuthorizationResponse>);
  if (!deviceResponse.ok) {
    const failure = responseError(rawDevice);
    throw new Error(`Device authorization failed (${deviceResponse.status}): ${failure.message || deviceResponse.statusText}`);
  }
  if (!device.device_code || !device.user_code || !device.verification_uri) {
    throw new Error('The registry returned an invalid device authorization response.');
  }

  const verificationUrl = assertRegistryOriginUrl(
    baseUrl,
    device.verification_uri_complete ||
      `${device.verification_uri}${device.verification_uri.includes('?') ? '&' : '?'}user_code=${encodeURIComponent(device.user_code)}`,
  );

  Logger.log('');
  Logger.log('Approve this device in your browser:');
  Logger.log(verificationUrl);
  Logger.log('');
  Logger.log(`Device code: ${device.user_code}`);
  Logger.log('');

  if (shouldOpenBrowser(options)) {
    tryOpenBrowser(verificationUrl);
    Logger.info('Attempted to open your default browser.');
  }

  const deadline = Date.now() + positiveNumberOr(device.expires_in, DEFAULT_DEVICE_EXPIRES_IN_SECONDS) * 1000;
  let intervalMs = positiveNumberOr(device.interval, DEFAULT_POLL_INTERVAL_SECONDS) * 1000;

  while (Date.now() < deadline) {
    await sleep(Math.min(intervalMs, Math.max(0, deadline - Date.now())));

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch(`${baseUrl}/api/oauth/token`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: DEVICE_GRANT,
          device_code: device.device_code,
        }),
      });
    } catch (error) {
      throw new Error(`Could not reach the registry at ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }

    const rawToken = await readJson(tokenResponse);
    const token = responsePayload(rawToken as TokenResponse | Envelope<TokenResponse>);
    if (tokenResponse.ok && token.access_token) {
      const expiresIn = positiveNumberOr(token.expires_in, DEFAULT_TOKEN_EXPIRES_IN_SECONDS);
      const auth: CliAuth = {
        remoteUrl: baseUrl,
        accessToken: token.access_token,
        expiresAtMs: Date.now() + expiresIn * 1000,
      };
      await writeCliAuth(workingPath, auth);
      return auth;
    }

    const failure = responseError(token);
    if (failure.code === 'authorization_pending') continue;
    if (failure.code === 'slow_down') {
      intervalMs = Math.min(intervalMs + 5_000, 60_000);
      continue;
    }
    if (failure.code === 'expired_token') break;
    throw new Error(`Token request failed: ${failure.message || tokenResponse.statusText || 'unknown error'}`);
  }

  throw new Error('Device authorization expired. Run `handoff-app login` again.');
};

/**
 * Best-effort remote revocation. The caller must clear the local credential regardless of failure.
 * The bearer header identifies the current token while the body supports RFC 7009-style handlers.
 */
export const revokeAccessToken = async (auth: CliAuth): Promise<void> => {
  const response = await fetch(`${normalizeRegistryUrl(auth.remoteUrl)}/api/oauth/revoke`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: auth.accessToken }),
  });
  if (!response.ok) {
    const body = await readJson(response);
    const failure = responseError(body);
    throw new Error(failure.message || `${response.status} ${response.statusText}`);
  }
};
