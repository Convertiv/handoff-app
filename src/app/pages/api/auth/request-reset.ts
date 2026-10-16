import type { NextApiRequest, NextApiResponse } from 'next';
import { consumeAuthRateLimit, createPasswordReset, normalizeEmail } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi, registryPageUrl } from '../../../lib/auth/api';
import { registryEmailIsConfigured, sendRegistryAuthEmail } from '../../../lib/auth/email';

const requestAddress = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
};

export default async function requestResetHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { mutation: true });
  if (!context) return;
  // The same answer for every address, so this reveals nothing about which accounts exist.
  if (!registryEmailIsConfigured()) {
    res.status(503).json({ error: 'Password reset by email is not available on this registry. Ask an administrator for a reset link.' });
    return;
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
  const throttle = await consumeAuthRateLimit(context.db, {
    bucket: 'password_reset',
    identifier: `${requestAddress(req)}:${email}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!throttle.allowed) {
    res.setHeader('Retry-After', String(throttle.retryAfterSeconds));
    res.status(429).json({ error: 'Too many reset requests. Try again later.' });
    return;
  }

  const result = await createPasswordReset(context.db, email);
  if (result.token && result.user) {
    const resetUrl = registryPageUrl('/reset-password', undefined, { token: result.token });
    // The result is ignored so the response never reveals whether the account exists.
    if (resetUrl) {
      await sendRegistryAuthEmail({
        to: result.user.email,
        subject: 'Reset your Handoff Registry password',
        heading: 'Reset your password',
        message: 'Use this single-use link to choose a new password. It expires in one hour.',
        actionLabel: 'Reset password',
        actionUrl: resetUrl,
      });
    }
  }
  res.status(200).json({ ok: true });
}
