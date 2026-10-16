import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRegistryAccessToken, revokeRegistryAccessToken } from '@handoff/registry/auth';
import { allowApiMethods, prepareRegistryApi } from '../../../lib/auth/api';
import { readRegistryCredential } from '../../../lib/registry-api/auth';

/**
 * Revoke the presenting token (RFC 7009 style), used by `handoff-app logout`.
 *
 * Either carrier is read, but only an access token can be revoked: the sync secret owns no token row
 * and is withdrawn by unsetting its variable, so it is rejected like any credential with no token
 * behind it.
 */

export default async function revokeTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['POST']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res);
  if (!context) return;
  const credential = readRegistryCredential(req);
  if (credential.kind === 'rejected') {
    res.status(400).json({ error: credential.message });
    return;
  }
  const principal = await authenticateRegistryAccessToken(context.db, credential.credential);
  if (!principal) {
    res.status(401).json({ error: 'A valid active access token is required.' });
    return;
  }
  await revokeRegistryAccessToken(context.db, { tokenId: principal.tokenId, userId: principal.userId });
  res.status(200).json({ ok: true });
}
