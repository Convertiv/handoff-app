import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRegistryRoute, sendRegistryError } from '@/lib/registry-api';
import { handleTransferRoute } from '@/lib/registry-api/transfer';

/**
 * `PUT /api/registry/transfer/{component|pattern}/:id` — publish ingestion (technical design §10,
 * issue #13). Registry-runtime only; requires the bearer token. This is the only path allowed to set
 * an entity's render/build-defining fields, source files, rendered artifacts, and build metadata.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const kind = Array.isArray(req.query.kind) ? req.query.kind[0] : req.query.kind;
  if (kind !== 'component' && kind !== 'pattern') {
    return handleRegistryRoute(req, res, ['PUT'], async () => {
      sendRegistryError(res, 'not_found', `Unknown transfer entity kind "${kind ?? ''}".`);
    });
  }
  return handleTransferRoute(req, res, kind);
}
