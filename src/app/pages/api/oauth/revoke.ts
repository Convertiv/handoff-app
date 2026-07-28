import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRegistryAccessToken, revokeRegistryAccessToken } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../lib/auth/api';

const bearerToken = (req: NextApiRequest): string => {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || '';
};

export default async function revokeTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res);
  if (!context) return;
  const principal = await authenticateRegistryAccessToken(context.db, bearerToken(req));
  if (!principal) {
    res.status(401).json({ error: 'A valid active access token is required.' });
    return;
  }
  await revokeRegistryAccessToken(context.db, { tokenId: principal.tokenId, userId: principal.userId });
  res.status(200).json({ ok: true });
}
