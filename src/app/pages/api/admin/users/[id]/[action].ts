import type { NextApiRequest, NextApiResponse } from 'next';
import { resendUserInvitation, setRegistryUserStatus, updateRegistryUserRole, type RegistryUserRole } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi, registryPageUrl } from '../../../../../lib/auth/api';
import { registryEmailIsConfigured, sendRegistryAuthEmail } from '../../../../../lib/auth/email';

const mutationError = (reason: string): { status: number; error: string } => {
  if (reason === 'not_found') return { status: 404, error: 'User not found.' };
  if (reason === 'last_admin') return { status: 409, error: 'The final active administrator cannot be changed.' };
  if (reason === 'self_deactivation') return { status: 409, error: 'You cannot deactivate your own account.' };
  return { status: 400, error: 'The requested user change is not valid.' };
};

export default async function userActionHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'admin', mutation: true });
  if (!context?.user) return;
  const userId = typeof req.query.id === 'string' ? req.query.id : '';
  const action = typeof req.query.action === 'string' ? req.query.action : '';
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  if (action === 'role') {
    if (body.role !== 'admin' && body.role !== 'member') {
      res.status(400).json({ error: 'Role must be admin or member.' });
      return;
    }
    const result = await updateRegistryUserRole(context.db, { userId, role: body.role as RegistryUserRole });
    if ('reason' in result) {
      const error = mutationError(result.reason);
      res.status(error.status).json({ error: error.error });
      return;
    }
    res.status(200).json({ user: result.user, message: 'User role updated.' });
    return;
  }

  if (action === 'status') {
    if (body.status !== 'active' && body.status !== 'deactivated') {
      res.status(400).json({ error: 'Status must be active or deactivated.' });
      return;
    }
    const result = await setRegistryUserStatus(context.db, {
      userId,
      status: body.status,
      actorUserId: context.user.id,
    });
    if ('reason' in result) {
      const error = mutationError(result.reason);
      res.status(error.status).json({ error: error.error });
      return;
    }
    res.status(200).json({ user: result.user, message: `User ${body.status}.` });
    return;
  }

  if (action === 'resend') {
    const result = await resendUserInvitation(context.db, { userId });
    if ('reason' in result) {
      const error = mutationError(result.reason);
      res.status(error.status).json({ error: error.error });
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
        res.status(502).json({ error: 'The invitation was renewed, but email delivery failed.' });
        return;
      }
      res.status(200).json({ user: result.user, message: 'Invitation resent.' });
      return;
    }
    res.status(200).json({ user: result.user, message: 'Invitation renewed for manual delivery.', activationUrl });
    return;
  }

  res.status(404).json({ error: 'Unknown user action.' });
}
