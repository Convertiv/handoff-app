import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { handleDocsRoute, parseSearchRequest, sendDocsData, sendDocsError } from '@/lib/docs-api';

/**
 * `GET /api/docs/search/pages.json?q={query}&group={group}&limit={limit}` returns ranked, display-ready
 * matches. Project pages replace package defaults with the same ID.
 *
 * Both runtime modes use the same ranking logic. `Cache-Control: no-store` makes published updates
 * available without another build or deployment. Static exports do not include API routes, so this
 * search endpoint is available only in server mode.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const parsed = parseSearchRequest(req);
    if ('error' in parsed) {
      sendDocsError(res, 'invalid_request', parsed.error);
      return;
    }
    const group = singleQueryValue(req.query.group)?.trim() || undefined;
    const response = await backend.searchPages({ ...parsed.request, group });
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    sendDocsData(res, 200, response);
  });
}
