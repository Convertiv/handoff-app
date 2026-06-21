import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityCollection } from '@/lib/registry-api/entity-routes';

/**
 * `GET /api/registry/components` (list) and `POST /api/registry/components` (create a metadata-only
 * record from allowlisted fields). Registry-runtime only; POST requires the bearer token.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityCollection(req, res, 'component');
}
