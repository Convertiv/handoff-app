import type { NextApiRequest, NextApiResponse } from 'next';
import { revokeRegistryAccessToken } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../../lib/auth/api';

export default async function accountTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['DELETE']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: true });
  if (!context?.user) return;
  const tokenId = typeof req.query.id === 'string' ? req.query.id : '';
  const revoked = await revokeRegistryAccessToken(context.db, { tokenId, userId: context.user.id });
  if (!revoked) {
    res.status(404).json({ error: 'Access token not found.' });
    return;
  }
  res.status(200).json({ ok: true });
}
