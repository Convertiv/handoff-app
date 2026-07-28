import type { NextApiRequest, NextApiResponse } from 'next';
import { approveRegistryDeviceAuthorization, denyRegistryDeviceAuthorization } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../../lib/auth/api';

export default async function approveDeviceHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: true });
  if (!context?.user) return;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const userCode = typeof body.user_code === 'string' ? body.user_code : typeof body.userCode === 'string' ? body.userCode : '';
  if (body.action === 'deny') {
    const denied = await denyRegistryDeviceAuthorization(context.db, userCode);
    res.status(denied ? 200 : 400).json(denied ? { ok: true } : { error: 'This device code is invalid or expired.' });
    return;
  }
  const result = await approveRegistryDeviceAuthorization(context.db, { userCode, userId: context.user.id });
  if (!result.ok) {
    res.status(400).json({ error: 'This device code is invalid or expired.' });
    return;
  }
  res.status(200).json({ ok: true, scopes: result.scopes });
}
