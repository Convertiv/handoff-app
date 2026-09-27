import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createPasswordReset,
  getRegistryUserById,
  resendUserInvitation,
  setRegistryUserStatus,
  updateRegistryUserRole,
  type RegistryUser,
  type RegistryUserRole,
} from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi, registryPageUrl } from '../../../../../lib/auth/api';
import { registryEmailIsConfigured, sendRegistryAuthEmail } from '../../../../../lib/auth/email';

const mutationError = (reason: string): { status: number; error: string } => {
  if (reason === 'not_found') return { status: 404, error: 'User not found.' };
  if (reason === 'last_admin') return { status: 409, error: 'The final active administrator cannot be changed.' };
  if (reason === 'self_deactivation') return { status: 409, error: 'You cannot deactivate your own account.' };
  return { status: 400, error: 'The requested user change is not valid.' };
};

/** Email the link when email is configured; otherwise return it once for the administrator to deliver. */
const deliverLink = async (
  res: NextApiResponse,
  user: RegistryUser,
  link: { url: string; subject: string; heading: string; message: string; actionLabel: string },
  messages: { sent: string; failed: string; manual: string }
) => {
  if (!registryEmailIsConfigured()) {
    res.status(200).json({ user, message: messages.manual, activationUrl: link.url });
    return;
  }
  const delivered = await sendRegistryAuthEmail({
    to: user.email,
    subject: link.subject,
    heading: link.heading,
    message: link.message,
    actionLabel: link.actionLabel,
    actionUrl: link.url,
  });
  if (!delivered) {
    res.status(502).json({ error: messages.failed });
    return;
  }
  res.status(200).json({ user, message: messages.sent });
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
    const activationUrl = registryPageUrl('/reset-password', undefined, { token: result.token, purpose: 'invite' });
    if (!activationUrl) {
      res.status(500).json({ error: 'AUTH_URL is not configured.' });
      return;
    }
    await deliverLink(
      res,
      result.user,
      {
        url: activationUrl,
        subject: 'Your Handoff Registry invitation',
        heading: 'You are invited',
        message: 'Set a password to activate your Handoff Registry account.',
        actionLabel: 'Accept invitation',
      },
      {
        sent: 'Invitation resent.',
        failed: 'The invitation was renewed, but email delivery failed.',
        manual: 'Invitation renewed for manual delivery.',
      }
    );
    return;
  }

  if (action === 'reset') {
    const user = await getRegistryUserById(context.db, userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const result = await createPasswordReset(context.db, user.email);
    if (!result.token || !result.user) {
      res.status(409).json({ error: 'Only active users can reset their password.' });
      return;
    }
    const resetUrl = registryPageUrl('/reset-password', undefined, { token: result.token });
    if (!resetUrl) {
      res.status(500).json({ error: 'AUTH_URL is not configured.' });
      return;
    }
    await deliverLink(
      res,
      result.user,
      {
        url: resetUrl,
        subject: 'Reset your Handoff Registry password',
        heading: 'Reset your password',
        message:
          'An administrator started a password reset for your account. Use this single-use link to choose a new password. It expires in one hour.',
        actionLabel: 'Reset password',
      },
      {
        sent: 'Password reset link sent.',
        failed: 'The reset link was created, but email delivery failed.',
        manual: 'Password reset link created for manual delivery. It expires in one hour.',
      }
    );
    return;
  }

  res.status(404).json({ error: 'Unknown user action.' });
}
