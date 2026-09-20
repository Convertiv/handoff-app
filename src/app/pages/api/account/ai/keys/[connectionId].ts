import type { NextApiRequest, NextApiResponse } from 'next';
import { MissingEncryptionSecretError, deleteRegistryAiKey, saveRegistryAiKey } from '@handoff/registry/auth';
import { aiCredentialKind } from '@handoff/ai/connections';
import { allowApiMethods, prepareRegistryApi } from '@/lib/auth/api';
import { findAiConnection } from '@/lib/ai/resolve';
import { getServerRuntimeConfig } from '@/lib/docs-api/runtime-config';

/**
 * `/api/account/ai/keys/[connectionId]`: save or remove this reader's key for one declared
 * connection. A connection id the config does not declare with `credential: 'user'` is rejected, so
 * a reader can never introduce an endpoint of their own.
 */

/** Longest key worth accepting. Provider keys are short; anything longer is a mistake or an attack. */
const MAX_KEY_LENGTH = 512;

export default async function accountAiKeyHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const method = allowApiMethods(req, res, ['PUT', 'DELETE']);
  if (!method) return;
  if (!getServerRuntimeConfig().ai.enabled) {
    res.status(404).end();
    return;
  }
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: true });
  if (!context?.user) return;

  const connectionId = typeof req.query.connectionId === 'string' ? req.query.connectionId : '';
  const connection = findAiConnection(connectionId);
  if (!connection || aiCredentialKind(connection) !== 'user') {
    res.status(404).json({ error: 'That AI connection does not take a personal API key.' });
    return;
  }

  if (method === 'DELETE') {
    const removed = await deleteRegistryAiKey(context.db, { userId: context.user.id, connectionId });
    if (!removed) {
      res.status(404).json({ error: 'No API key is saved for that connection.' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  const key = typeof (req.body as { key?: unknown })?.key === 'string' ? (req.body as { key: string }).key.trim() : '';
  if (!key || key.length > MAX_KEY_LENGTH) {
    res.status(400).json({ error: 'Enter the API key for this provider.' });
    return;
  }

  try {
    await saveRegistryAiKey(context.db, { userId: context.user.id, connectionId, key });
  } catch (error) {
    if (error instanceof MissingEncryptionSecretError) {
      res.status(503).json({ error: error.message, code: 'encryption_secret_missing' });
      return;
    }
    throw error;
  }
  res.status(200).json({ ok: true });
}
