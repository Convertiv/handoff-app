import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createRegistryAccessToken,
  listRegistryAccessTokens,
  REGISTRY_READ_SCOPE,
  REGISTRY_WRITE_SCOPE,
  type RegistryAccessScope,
} from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../../lib/auth/api';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default async function accountTokensHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['GET', 'POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: method === 'POST' });
  if (!context?.user) return;

  if (method === 'GET') {
    const tokens = await listRegistryAccessTokens(context.db, context.user.id);
    res.status(200).json({ tokens });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const requested = Array.isArray(body.scopes) ? body.scopes : [];
  const scopes = requested.filter(
    (scope: unknown): scope is RegistryAccessScope => scope === REGISTRY_READ_SCOPE || scope === REGISTRY_WRITE_SCOPE
  );
  const normalizedScopes = scopes.includes(REGISTRY_WRITE_SCOPE) ? [REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE] : [REGISTRY_READ_SCOPE];
  const result = await createRegistryAccessToken(context.db, {
    userId: context.user.id,
    name: typeof body.name === 'string' ? body.name : '',
    scopes: normalizedScopes,
    expiresAt: new Date(Date.now() + ONE_YEAR_MS),
  });
  if ('reason' in result) {
    res.status(result.reason === 'scope_forbidden' ? 403 : 400).json({
      error: result.reason === 'scope_forbidden' ? 'Only administrators can create write tokens.' : 'Enter a valid token name and scope.',
    });
    return;
  }
  res.status(201).json({ token: result.token, accessToken: result.token, record: result.record });
}
