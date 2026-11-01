import type { NextApiRequest, NextApiResponse } from 'next';
import type { RegistryUserRole } from '@handoff/registry/auth';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';

/**
 * Authorization for the AI routes.
 *
 * The chat route authorizes once, on the session, the way the account routes do. Tools that write
 * check their own scope per call.
 *
 * A build with the assistant turned off answers 404 rather than 403, so a feature that is absent
 * reads as absent instead of as something a credential would unlock. That check runs before any
 * auth work, exactly as `/api/mcp/` does it.
 */

/** The reader behind one request: a registry user, or `null` ids in a workspace, which has one user. */
export interface AiReader {
  userId: string | null;
  role: RegistryUserRole | null;
}

export const authorizeAiRequest = async (req: NextApiRequest, res: NextApiResponse, mutation = false): Promise<AiReader | null> => {
  const runtime = getServerRuntimeConfig();
  if (!runtime.ai.enabled) {
    res.status(404).end();
    return null;
  }
  if (runtime.mode !== 'registry') {
    return { userId: null, role: null };
  }
  // Imported lazily so the registry auth/database dependencies stay out of the workspace path.
  const { prepareRegistryApi } = await import('../auth/api');
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation });
  return context?.user ? { userId: context.user.id, role: context.user.role } : null;
};
