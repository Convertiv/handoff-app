import type { NextApiRequest, NextApiResponse } from 'next';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { getRegistryInstallationState, type RegistryUser } from '@handoff/registry/auth';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { getRegistryConnection, RegistryConnectionError } from '../registry-connection';
import { canonicalRegistryUrl, getRegistrySessionUser } from './config';

export const allowApiMethods = (req: NextApiRequest, res: NextApiResponse, methods: string[]): string | null => {
  const method = (req.method ?? 'GET').toUpperCase();
  if (methods.includes(method)) return method;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ error: `Method ${method} is not allowed.` });
  return null;
};

export const registryPageUrl = (
  path: string,
  query?: Record<string, string>,
  fragment?: Record<string, string>
): string | null => {
  const canonical = canonicalRegistryUrl();
  if (!canonical) return null;
  const base = canonical.pathname.replace(/\/+$/, '');
  canonical.pathname = `${base}/${path.replace(/^\/+/, '')}`;
  canonical.search = '';
  canonical.hash = '';
  if (query) {
    for (const [key, value] of Object.entries(query)) canonical.searchParams.set(key, value);
  }
  // Put secrets (invite/reset tokens) in the fragment rather than the query string. The fragment
  // never reaches the server, so it stays out of access logs, proxies, and Referer headers.
  if (fragment) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(fragment)) params.set(key, value);
    canonical.hash = params.toString();
  }
  return canonical.toString();
};

const requestOriginIsAllowed = (req: NextApiRequest): boolean => {
  const origin = req.headers.origin;
  if (!origin) return true;
  const canonical = canonicalRegistryUrl();
  if (canonical) return origin === canonical.origin;
  const proto = String(req.headers['x-forwarded-proto'] || 'http')
    .split(',')[0]
    .trim();
  return origin === `${proto}://${req.headers.host}`;
};

export interface RegistryApiContext {
  db: RegistryDatabase;
  user?: RegistryUser;
}

export interface RegistryApiOptions {
  installed?: boolean;
  auth?: 'user' | 'admin';
  mutation?: boolean;
}

/**
 * Shared browser-auth API boundary. Client redirects are convenience only; installation, live user
 * status, role, and same-origin mutation checks are enforced here on every protected request.
 */
export const prepareRegistryApi = async (
  req: NextApiRequest,
  res: NextApiResponse,
  options: RegistryApiOptions = {}
): Promise<RegistryApiContext | null> => {
  if (getServerRuntimeConfig().mode !== 'registry') {
    res.status(409).json({ error: 'This endpoint is available only in registry mode.' });
    return null;
  }
  if (options.mutation && !requestOriginIsAllowed(req)) {
    res.status(403).json({ error: 'The request origin is not allowed.' });
    return null;
  }

  let db: RegistryDatabase;
  try {
    ({ db } = await getRegistryConnection());
  } catch (error) {
    const message = error instanceof RegistryConnectionError ? error.message : 'The registry database is unavailable.';
    res.status(503).json({ error: message });
    return null;
  }

  if (options.installed !== false) {
    try {
      const installation = await getRegistryInstallationState(db);
      if (installation.status !== 'installed') {
        res.status(409).json({ error: 'Complete the registry installation before using this endpoint.', code: 'installation_required' });
        return null;
      }
    } catch {
      res.status(503).json({ error: 'Registry authentication migrations are missing. Run `handoff-app db:migrate`.' });
      return null;
    }
  }

  if (!options.auth) return { db };
  const user = await getRegistrySessionUser(req, res);
  if (!user) {
    res.status(401).json({ error: 'Sign in with an active registry account.' });
    return null;
  }
  if (options.auth === 'admin' && user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access is required.' });
    return null;
  }
  return { db, user };
};
