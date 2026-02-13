import { Logger } from '../utils/logger';

// ── Types ───────────────────────────────────────────────────────────────

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
}

export interface TokenPollPending {
  status: 'pending';
}

export interface TokenPollApproved {
  status: 'approved';
  token: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export type TokenPollResponse = TokenPollPending | TokenPollApproved;

export interface CliProject {
  id: string;
  name: string;
  slug: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
  syncVersion: number;
}

export interface ManifestFile {
  etag: string;
  size: number;
  lastModified: string;
}

export interface SyncManifest {
  projectId: string;
  version: number;
  prefix: string;
  files: Record<string, ManifestFile>;
}

export interface PushResult {
  success: boolean;
  version: number;
  uploaded: string[];
  deleted: string[];
  errors: string[];
  files: Record<string, ManifestFile>;
}

export interface ConflictResponse {
  error: 'conflict';
  message: string;
  currentVersion: number;
  files: Record<string, ManifestFile>;
}

export interface CreatePushResult {
  project: {
    id: string;
    name: string;
    slug: string;
    orgId: string;
    [key: string]: unknown;
  };
  syncVersion: number;
  uploaded: number;
  errors: string[];
  files: Record<string, ManifestFile>;
}

// ── Helpers ─────────────────────────────────────────────────────────────

class PlatformApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'PlatformApiError';
  }
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    let message = `${context}: HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = `${context}: ${body.error}`;
      if (body.message) message = `${context}: ${body.message}`;
    } catch {
      // ignore parse errors
    }
    throw new PlatformApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

// ── API Functions ───────────────────────────────────────────────────────

/**
 * Initiate the device-code auth flow.
 */
export async function createDeviceCode(baseUrl: string): Promise<DeviceCodeResponse> {
  const res = await fetch(`${baseUrl}/api/cli/auth/device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<DeviceCodeResponse>(res, 'Device code creation');
}

/**
 * Poll for an approved token. Resolves when approved or rejects on
 * expiry / error.
 */
export async function pollForToken(
  baseUrl: string,
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<TokenPollApproved> {
  const deadline = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    await sleep(interval * 1000);

    const res = await fetch(`${baseUrl}/api/cli/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceCode }),
    });

    if (res.status === 410) {
      throw new PlatformApiError(410, 'Device code expired. Please try logging in again.');
    }

    if (res.status === 404) {
      throw new PlatformApiError(404, 'Invalid device code.');
    }

    const body = (await res.json()) as TokenPollResponse;

    if (body.status === 'approved') {
      return body;
    }

    Logger.debug('Token poll: still pending...');
  }

  throw new PlatformApiError(408, 'Authentication timed out. Please try again.');
}

/**
 * Revoke (logout) the current CLI token.
 */
export async function revokeToken(baseUrl: string, token: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/cli/auth/token`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 401) {
    await handleResponse<any>(res, 'Token revocation');
  }
}

/**
 * List all projects accessible to the authenticated user.
 */
export async function listProjects(baseUrl: string, token: string): Promise<CliProject[]> {
  const res = await fetch(`${baseUrl}/api/cli/projects`, {
    headers: authHeaders(token),
  });
  return handleResponse<CliProject[]>(res, 'List projects');
}

/**
 * Get the file manifest for a project.
 */
export async function getManifest(
  baseUrl: string,
  token: string,
  projectId: string
): Promise<SyncManifest> {
  const res = await fetch(`${baseUrl}/api/cli/projects/${projectId}/sync/manifest`, {
    headers: authHeaders(token),
  });
  return handleResponse<SyncManifest>(res, 'Get manifest');
}

/**
 * Download a single file from the project by relative path.
 * Returns the file content as a Buffer.
 */
export async function downloadFile(
  baseUrl: string,
  token: string,
  projectId: string,
  filePath: string
): Promise<Buffer> {
  const url = `${baseUrl}/api/cli/projects/${projectId}/sync/file?path=${encodeURIComponent(filePath)}`;
  const res = await fetch(url, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    let message = `Download file "${filePath}": HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = `Download file "${filePath}": ${body.error}`;
    } catch {
      // response might not be JSON
    }
    throw new PlatformApiError(res.status, message);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Push file changes to the project. Uses multipart/form-data.
 *
 * @param files Map of relative path -> file Buffer
 * @param deleted Array of relative paths to delete
 * @returns PushResult on success
 * @throws PlatformApiError with status 409 on version conflict
 */
export async function pushChanges(
  baseUrl: string,
  token: string,
  projectId: string,
  baseVersion: number,
  files: Map<string, Buffer>,
  deleted: string[]
): Promise<PushResult> {
  // Use the built-in FormData (Node 18+) — the `form-data` npm package
  // is stream-based and incompatible with native fetch.
  const form = new FormData();

  form.append('baseVersion', String(baseVersion));

  if (deleted.length > 0) {
    form.append('deleted', JSON.stringify(deleted));
  }

  for (const [filePath, content] of files) {
    const blob = new Blob([new Uint8Array(content)]);
    form.append(filePath, blob, filePath);
  }

  const res = await fetch(`${baseUrl}/api/cli/projects/${projectId}/sync/push`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
    },
    body: form,
  });

  if (res.status === 409) {
    const body = (await res.json()) as ConflictResponse;
    const err = new PlatformApiError(409, body.message || 'Version conflict — pull first');
    (err as any).conflictData = body;
    throw err;
  }

  return handleResponse<PushResult>(res, 'Push changes');
}

/**
 * Create a new project and push all files in a single request.
 * Used for onboarding existing handoff-app projects to the platform.
 *
 * @param orgId Organization to create the project in
 * @param name Optional project name (falls back to app.title in config)
 * @param figmaProjectId Optional Figma file ID
 * @param files Map of relative path -> file Buffer
 */
export async function createPush(
  baseUrl: string,
  token: string,
  orgId: string,
  files: Map<string, Buffer>,
  options: {
    name?: string;
    figmaProjectId?: string;
  } = {}
): Promise<CreatePushResult> {
  const form = new FormData();

  form.append('orgId', orgId);

  if (options.name) {
    form.append('name', options.name);
  }

  if (options.figmaProjectId) {
    form.append('figmaProjectId', options.figmaProjectId);
  }

  for (const [filePath, content] of files) {
    const blob = new Blob([new Uint8Array(content)]);
    form.append(filePath, blob, filePath);
  }

  const res = await fetch(`${baseUrl}/api/cli/projects/create-push`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
    },
    body: form,
  });

  return handleResponse<CreatePushResult>(res, 'Create and push project');
}

// ── Utilities ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { PlatformApiError };
