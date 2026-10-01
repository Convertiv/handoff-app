import { authApiUrl } from './api';

export interface InstallStatus {
  installed?: boolean;
  emailConfigured?: boolean;
}

// Installation is one-way, so an installed result is kept until a hard reload. Concurrent callers
// share one request.
let cachedStatus: InstallStatus | null = null;
let inFlight: Promise<InstallStatus | null> | null = null;

/** The registry installation status, or `null` when it could not be read. */
export const loadInstallStatus = (): Promise<InstallStatus | null> => {
  if (cachedStatus) return Promise.resolve(cachedStatus);
  if (inFlight) return inFlight;
  inFlight = fetch(authApiUrl('/api/install'), { credentials: 'include', cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return null;
      const status = (await response.json()) as InstallStatus;
      if (status.installed === true) cachedStatus = status;
      return status;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};
