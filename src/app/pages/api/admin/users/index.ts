import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserInvitation, listRegistryUsers, type RegistryUserRole } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi, registryPageUrl } from '../../../../lib/auth/api';
import { registryEmailIsConfigured, sendRegistryAuthEmail } from '../../../../lib/auth/email';

export default async function usersHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['GET', 'POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'admin', mutation: method === 'POST' });
  if (!context?.user) return;

  if (method === 'GET') {
    res.status(200).json({ users: await listRegistryUsers(context.db) });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const role: RegistryUserRole = body.role === 'admin' ? 'admin' : 'member';
  const result = await createUserInvitation(context.db, {
    email: typeof body.email === 'string' ? body.email : '',
    name: typeof body.name === 'string' ? body.name : '',
    role,
  });
  if ('reason' in result) {
    res.status(result.reason === 'email_exists' ? 409 : 400).json({
      error: result.reason === 'email_exists' ? 'A user with this email already exists.' : 'Enter a valid email and display name.',
    });
    return;
  }

  const activationUrl = registryPageUrl('/reset-password', { token: result.token, purpose: 'invite' });
  if (!activationUrl) {
    res.status(500).json({ error: 'AUTH_URL is not configured.' });
    return;
  }
  if (registryEmailIsConfigured()) {
    const delivered = await sendRegistryAuthEmail({
      to: result.user.email,
      subject: 'Your Handoff Registry invitation',
      heading: 'You are invited',
      message: 'Set a password to activate your Handoff Registry account.',
      actionLabel: 'Accept invitation',
      actionUrl: activationUrl,
    });
    if (!delivered) {
      res.status(502).json({ error: 'The invitation was created, but email delivery failed. Fix Resend configuration and resend it.' });
      return;
    }
    res.status(201).json({ user: result.user, message: 'Invitation sent.' });
    return;
  }
  res.status(201).json({ user: result.user, message: 'Invitation created for manual delivery.', activationUrl });
}
