import type { NextApiRequest, NextApiResponse } from 'next';
import { getRegistryInstallationState, installRegistry } from '@handoff/registry/auth';
import { allowApiMethods, canonicalRegistryUrl, prepareRegistryApi } from '../../lib/auth/api';
import { registryAuthSecret } from '../../lib/auth/config';
import { registryEmailIsConfigured } from '../../lib/auth/email';

const check = (id: string, label: string, ok: boolean, message: string, optional = false) => ({
  id,
  label,
  ok,
  message,
  optional,
});

export default async function installHandler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  const method = allowApiMethods(req, res, ['GET', 'POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { installed: false, mutation: method === 'POST' });
  if (!context) return;

  let state: Awaited<ReturnType<typeof getRegistryInstallationState>> | null = null;
  try {
    state = await getRegistryInstallationState(context.db);
  } catch {
    // A failed state query means the registry database is not ready to serve the installer; the
    // database check below reports it.
  }

  const installed = state?.status === 'installed';
  if (method === 'GET') {
    const secretReady = registryAuthSecret().length >= 32;
    const canonicalReady = canonicalRegistryUrl() !== null;
    const databaseReady = Boolean(state);
    const emptyUsers = state?.status === 'ready';
    const checks = [
      check('runtime', 'Registry runtime', true, 'This deployment is running in registry mode.'),
      check(
        'database',
        'Database connection',
        databaseReady,
        databaseReady ? 'The registry database is reachable.' : 'The registry database is not ready. Check the deployment and try again.'
      ),
      check(
        'authSecret',
        'Authentication secret',
        secretReady,
        secretReady ? 'AUTH_SECRET is configured.' : 'Set AUTH_SECRET to a random value of at least 32 characters.'
      ),
      check(
        'appUrl',
        'Canonical application URL',
        canonicalReady,
        canonicalReady ? 'AUTH_URL is a valid absolute HTTP(S) URL.' : 'Set AUTH_URL to the public registry URL, including its base path.'
      ),
      check(
        'email',
        'Email delivery',
        registryEmailIsConfigured(),
        registryEmailIsConfigured()
          ? 'Resend delivery is configured.'
          : 'Optional. Set RESEND_API_KEY and AUTH_FROM_EMAIL, or deliver invitation links manually.',
        true
      ),
    ];
    const ready = !installed && Boolean(emptyUsers && state) && secretReady && canonicalReady;
    res.status(200).json({ installed, ready, checks, emailConfigured: registryEmailIsConfigured() });
    return;
  }

  if (installed) {
    res.status(409).json({ error: 'This registry has already been installed.', installed: true });
    return;
  }
  if (!state || state.status !== 'ready' || registryAuthSecret().length < 32 || !canonicalRegistryUrl()) {
    res.status(409).json({ error: 'The registry did not pass installation preflight. Correct the deployment configuration and retry.' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const password = typeof body.password === 'string' ? body.password : '';
  if (password !== body.passwordConfirmation) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }
  const result = await installRegistry(context.db, {
    email: typeof body.email === 'string' ? body.email : '',
    name: typeof body.name === 'string' ? body.name : '',
    password,
  });
  if ('reason' in result) {
    if (result.reason === 'already_installed' || result.reason === 'users_exist') {
      res.status(409).json({ error: 'This registry has already been claimed or contains users.', installed: true });
      return;
    }
    res.status(400).json({ error: 'error' in result && result.error ? result.error : 'Enter a valid email, display name, and password.' });
    return;
  }
  res.status(201).json({ ok: true, user: result.user });
}
