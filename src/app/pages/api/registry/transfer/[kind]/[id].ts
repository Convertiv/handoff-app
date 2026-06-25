import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRegistryRoute, sendRegistryError } from '@/lib/registry-api';
import { handleCheckoutRoute, handleTransferRoute } from '@/lib/registry-api/transfer';

/**
 * `/api/registry/transfer/{component|pattern}/:id` — the transfer endpoint.
 *
 * - `GET` is checkout: returns the normalized record + registry-safe source files so a
 *   connected workspace can reconstruct the entity locally. Unauthenticated read.
 * - `PUT` is publish ingestion: the only path allowed to set an entity's
 *   render/build-defining fields, source files, rendered artifacts, and build metadata. Requires the
 *   bearer token.
 *
 * Both are registry-runtime only (enforced by the guard stack).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const kind = Array.isArray(req.query.kind) ? req.query.kind[0] : req.query.kind;
  if (kind !== 'component' && kind !== 'pattern') {
    return handleRegistryRoute(req, res, ['GET', 'PUT'], async () => {
      sendRegistryError(res, 'not_found', `Unknown transfer entity kind "${kind ?? ''}".`);
    });
  }
  const method = (req.method ?? 'GET').toUpperCase();
  return method === 'GET' ? handleCheckoutRoute(req, res, kind) : handleTransferRoute(req, res, kind);
}

/**
 * Publish packages (source files + rendered artifacts) are the largest registry payloads, so accept
 * up to Vercel's 4.5 MB function body limit instead of Next's 1 MB default (anything larger would be
 * rejected by the platform with `413 FUNCTION_PAYLOAD_TOO_LARGE` regardless of this setting).
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
