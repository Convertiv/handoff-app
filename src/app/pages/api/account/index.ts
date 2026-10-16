import type { NextApiRequest, NextApiResponse } from 'next';
import { buildGravatarUrl, updateRegistryUserProfile } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../lib/auth/api';

export default async function accountHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['GET', 'PUT']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: method === 'PUT' });
  if (!context?.user) return;

  if (method === 'GET') {
    res.status(200).json({ user: context.user, gravatarUrl: buildGravatarUrl(context.user.email) });
    return;
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const result = await updateRegistryUserProfile(context.db, {
    userId: context.user.id,
    name: typeof body.name === 'string' ? body.name : '',
    image: typeof body.avatarUrl === 'string' ? body.avatarUrl : null,
  });
  if ('reason' in result) {
    res.status(result.reason === 'not_found' ? 404 : 400).json({ error: 'Enter a valid display name and HTTPS avatar URL.' });
    return;
  }
  res.status(200).json({ user: result.user });
}
