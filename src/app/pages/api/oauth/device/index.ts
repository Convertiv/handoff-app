import type { NextApiRequest, NextApiResponse } from 'next';
import { consumeAuthRateLimit, createRegistryDeviceAuthorization } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi, registryPageUrl } from '../../../../lib/auth/api';

const requestAddress = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
};

export default async function deviceAuthorizationHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res);
  if (!context) return;
  const throttle = await consumeAuthRateLimit(context.db, {
    bucket: 'device',
    identifier: requestAddress(req),
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!throttle.allowed) {
    res.setHeader('Retry-After', String(throttle.retryAfterSeconds));
    res.status(429).json({ error: 'slow_down', error_description: 'Too many device authorization requests.' });
    return;
  }
  const authorization = await createRegistryDeviceAuthorization(context.db);
  const verificationUri = registryPageUrl('/cli/device');
  const verificationUriComplete = registryPageUrl('/cli/device', { user_code: authorization.userCode });
  if (!verificationUri || !verificationUriComplete) {
    res.status(500).json({ error: 'server_error', error_description: 'AUTH_URL is not configured.' });
    return;
  }
  res.status(200).json({
    device_code: authorization.deviceCode,
    user_code: authorization.userCode,
    verification_uri: verificationUri,
    verification_uri_complete: verificationUriComplete,
    expires_in: authorization.expiresIn,
    interval: authorization.interval,
  });
}
