import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityFileItem } from '@/lib/registry-api/entity-routes';

/**
 * `GET`, `PUT`, and `DELETE` for a single component text-file record addressed by its relative
 * path. Declaration kind and unsafe paths are rejected; mutations require a write-scoped credential.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityFileItem(req, res, 'component');
}

/** Accept request bodies up to Vercel's 4.5 MB function limit (vs. Next's 1 MB default) for the PUT file upsert. */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
