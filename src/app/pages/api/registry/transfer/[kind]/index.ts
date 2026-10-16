import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { handleRegistryRoute, sendRegistryError } from '@/lib/registry-api';
import { handleEntitySummaryRoute } from '@/lib/registry-api/transfer';

/**
 * `GET /api/registry/transfer/{component|pattern|page}`. Lists the registry's published entity
 * summaries for one kind (id, build hashes, status) so a connected workspace can skip unchanged
 * entities on a bulk publish and enumerate published ids for a bulk checkout. Registry-runtime only,
 * enforced by the guard stack. The `tokens` and `assets` summaries have their own static routes,
 * which Next resolves before this dynamic segment.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const kind = singleQueryValue(req.query.kind);
  if (kind !== 'component' && kind !== 'pattern' && kind !== 'page') {
    return handleRegistryRoute(req, res, ['GET'], async () => {
      sendRegistryError(res, 'not_found', `Unknown transfer entity kind "${kind ?? ''}".`);
    });
  }
  return handleEntitySummaryRoute(req, res, kind);
}
