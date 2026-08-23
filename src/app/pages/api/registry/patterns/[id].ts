import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityItem } from '@/lib/registry-api/entity-routes';

/**
 * `GET` (detail incl. build state), `PUT` (allowlisted metadata update — never touches
 * artifacts/build), and `DELETE` for a single pattern. Registry-runtime only; mutations require a
 * write-scoped credential.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityItem(req, res, 'pattern');
}

/** Accept request bodies up to Vercel's 4.5 MB function limit (vs. Next's 1 MB default) for the PUT write. */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
