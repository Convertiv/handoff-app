import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveDocsBackend, type DocsBackend } from './backend';
import { ensureGet, sendDocsError } from './errors';

/** Write a successful docs read API JSON response. */
export const sendDocsData = (res: NextApiResponse, status: number, data: unknown): void => {
  res.status(status).json(data);
};

/**
 * Shared entry point for every `/api/docs/*` route.
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
    console.error('Docs read API request failed.', error);
    sendDocsError(res, 'unexpected_error', 'Unexpected docs read API error.');
  }
};
