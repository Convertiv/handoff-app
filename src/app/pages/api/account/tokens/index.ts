import type { NextApiRequest, NextApiResponse } from 'next';
import { createRegistryAccessToken, expandRegistryScopes, listRegistryAccessTokens } from '@handoff/registry/auth';
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
  // Accepts the documented `sync:*` aliases as well as the canonical scope names; write implies read.
  const scopes = expandRegistryScopes(Array.isArray(body.scopes) ? body.scopes : []);
  const result = await createRegistryAccessToken(context.db, {
    userId: context.user.id,
    name: typeof body.name === 'string' ? body.name : '',
    scopes,
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
