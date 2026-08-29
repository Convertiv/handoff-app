import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityCollection } from '@/lib/registry-api/entity-routes';

/**
 * `GET /api/registry/pages` (list) and `POST /api/registry/pages` (create a metadata-only page from
 * allowlisted fields). Registry-runtime only; POST requires a write-scoped credential.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityCollection(req, res, 'page');
}

/** Accept request bodies up to Vercel's 4.5 MB function limit (vs. Next's 1 MB default) for the POST write. */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
