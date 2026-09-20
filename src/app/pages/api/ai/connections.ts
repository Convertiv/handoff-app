import type { NextApiRequest, NextApiResponse } from 'next';
import { authorizeAiRequest } from '@/lib/ai/auth';
import { describeAiConnections } from '@/lib/ai/resolve';
import { getServerRuntimeConfig } from '@/lib/docs-api/runtime-config';
import { allowApiMethods } from '@/lib/api/methods';

/**
 * `/api/ai/connections`: the models this reader can actually run right now, for the assistant's
 * model picker. Never carries a key, only whether one is in place.
 */
export default async function aiConnectionsHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!allowApiMethods(req, res, ['GET'])) return;
  const reader = await authorizeAiRequest(req, res);
  if (!reader) return;

  const connections = await describeAiConnections(reader.userId);
  res.status(200).json({
    connections,
    defaultModel: getServerRuntimeConfig().ai.defaultModel ?? null,
    /** Whether this deployment has a page where a reader can add their own key. */
    canAddKeys: getServerRuntimeConfig().mode === 'registry' && connections.some((connection) => connection.credential === 'user'),
  });
}
