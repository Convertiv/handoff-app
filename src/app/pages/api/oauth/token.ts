import type { NextApiRequest, NextApiResponse } from 'next';
import { exchangeRegistryDeviceAuthorization } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../lib/auth/api';

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

export default async function deviceTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res);
  if (!context) return;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (body.grant_type !== DEVICE_GRANT || typeof body.device_code !== 'string') {
    res.status(400).json({ error: 'unsupported_grant_type', error_description: 'Use the OAuth device authorization grant.' });
    return;
  }
  const result = await exchangeRegistryDeviceAuthorization(context.db, {
    deviceCode: body.device_code,
    tokenName: typeof body.token_name === 'string' ? body.token_name : 'Handoff CLI',
  });
  if ('error' in result) {
    res.status(400).json({ error: result.error, error_description: result.errorDescription });
    return;
  }
  res.status(200).json({
    access_token: result.accessToken,
    token_type: result.tokenType,
    expires_in: result.expiresIn,
    scope: result.scopes.join(' '),
  });
}
