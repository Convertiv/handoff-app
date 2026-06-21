import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityFileItem } from '@/lib/registry-api/entity-routes';

/**
 * `GET`, `PUT`, and `DELETE` for a single pattern text-file record addressed by its relative path.
 * Declaration kind and unsafe paths are rejected; mutations require the bearer token.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityFileItem(req, res, 'pattern');
}
