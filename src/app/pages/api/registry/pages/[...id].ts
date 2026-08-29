import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityItem } from '@/lib/registry-api/entity-routes';

/**
 * `GET` (detail incl. source state), `PUT` (allowlisted metadata/frontmatter update), and `DELETE`
 * for a top-level or nested page. Page source files are intentionally not exposed. Registry-runtime
 * only; mutations require a write-scoped credential.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityItem(req, res, 'page');
}

/** Accept request bodies up to Vercel's 4.5 MB function limit (vs. Next's 1 MB default) for the PUT write. */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
