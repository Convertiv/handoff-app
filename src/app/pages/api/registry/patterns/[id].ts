import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityItem } from '@/lib/registry-api/entity-routes';

/**
 * `GET` (detail incl. build state), `PUT` (allowlisted metadata update — never touches
 * artifacts/build), and `DELETE` for a single pattern. Registry-runtime only; mutations require the
 * bearer token.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityItem(req, res, 'pattern');
}
