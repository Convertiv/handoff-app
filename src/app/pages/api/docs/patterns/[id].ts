import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, idFromJsonParam, sendDocsData, sendDocsError } from '@/lib/docs-api';

/**
 * `GET /api/docs/patterns/{id}.json` — a single `PatternListObject` including build state;
 * `404 not_found` when the pattern does not exist. The dynamic param carries
 * the explicit `.json` extension, which is stripped to recover the id. The shape is identical
 * regardless of whether the filesystem or the database backs it.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const id = idFromJsonParam(req.query.id);
    if (!id) {
      sendDocsError(res, 'not_found', 'Missing pattern id.');
      return;
    }
    const detail = await backend.getPatternDetail(id);
    if (!detail) {
      sendDocsError(res, 'not_found', `Pattern "${id}" was not found.`);
      return;
    }
    sendDocsData(res, 200, detail);
  });
}
