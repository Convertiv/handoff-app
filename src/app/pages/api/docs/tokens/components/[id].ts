import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, idFromJsonParam, sendDocsError } from '@/lib/docs-api';
import { tokenFormatStrings } from '@/lib/docs-api/token-detail';

/**
 * `GET /api/docs/tokens/components/{id}.json` — the `component/{id}` token set: the component token
 * object (`component`) plus the generated download strings (css/scss/styleDictionary/types) and the
 * full artifact list. Mode-independent shape. `Cache-Control: no-store` so a publish surfaces without
 * a rebuild/redeploy.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const id = idFromJsonParam(req.query.id);
    if (!id) {
      sendDocsError(res, 'not_found', 'Missing component token id.');
      return;
    }
    const detail = await backend.getTokenSetDetail(`component/${id}`);
    if (!detail) {
      sendDocsError(res, 'not_found', `Component token set "${id}" was not found.`);
      return;
    }
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({
      component: detail.record,
      ...tokenFormatStrings(detail.artifacts),
      artifacts: detail.artifacts,
    });
  });
}
