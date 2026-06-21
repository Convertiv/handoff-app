import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveDocsBackend, type DocsBackend } from './backend';
import { ensureGet, sendDocsError } from './errors';

/**
 * Shared entry point for every `/api/docs/*` route (technical design §5/§12).
 *
 * Applies the GET-only guard, resolves the mode-aware {@link DocsBackend}, and runs the route's
 * logic against it — translating any thrown failure (e.g. a database that is unreachable in
 * registry mode) into the docs read API's `unexpected_error` envelope. Routes stay thin and never
 * need to know which backing serves them.
 */
export const handleDocsRoute = async (
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (backend: DocsBackend) => Promise<void>
): Promise<void> => {
  if (!ensureGet(req, res)) {
    return;
  }
  try {
    const backend = await resolveDocsBackend();
    await handler(backend);
  } catch (error) {
    sendDocsError(res, 'unexpected_error', error instanceof Error ? error.message : 'Unexpected docs read API error.');
  }
};
