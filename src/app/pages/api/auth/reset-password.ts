import type { NextApiRequest, NextApiResponse } from 'next';
import { acceptUserInvitation, resetPassword } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../lib/auth/api';

export default async function resetPasswordHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { mutation: true });
  if (!context) return;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (password !== body.passwordConfirmation) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }
  const result =
    body.purpose === 'invite'
      ? await acceptUserInvitation(context.db, { token, password })
      : await resetPassword(context.db, { token, password });
  if ('reason' in result) {
    res.status(400).json({
      error:
        result.reason === 'invalid_password' && result.error ? result.error : 'This link is invalid, expired, or has already been used.',
    });
    return;
  }
  res.status(200).json({ ok: true });
}
