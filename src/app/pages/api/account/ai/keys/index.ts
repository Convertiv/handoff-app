import type { NextApiRequest, NextApiResponse } from 'next';
import { allowApiMethods, prepareRegistryApi } from '@/lib/auth/api';
import { describeAiUserConnections } from '@/lib/ai/resolve';
import { getServerRuntimeConfig } from '@/lib/docs-api/runtime-config';

/**
 * `/api/account/ai/keys`: the connections this reader may add a key for, each with whether they
 * already have. The key value is write-only across this boundary and is never returned.
 */
export default async function accountAiKeysHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!allowApiMethods(req, res, ['GET'])) return;
  if (!getServerRuntimeConfig().ai.enabled) {
    res.status(404).end();
    return;
  }
  const context = await prepareRegistryApi(req, res, { auth: 'user' });
  if (!context?.user) return;

  res.status(200).json({ connections: await describeAiUserConnections(context.user.id) });
}
