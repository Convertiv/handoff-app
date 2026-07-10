import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, idFromJsonParam, sendDocsData, sendDocsError } from '@/lib/docs-api';
import { localStylesKeyForFoundationType } from '@handoff/registry/tokens/sets';
import { tokenFormatStrings } from '@/lib/docs-api/token-detail';

/**
 * `GET /api/docs/tokens/foundations/{type}.json` — the `foundation/{type}` set: the `localStyles`
 * slice (`design`) plus the generated download strings (css/scss/styleDictionary/types) and the full
 * artifact list. Mode-independent: the same shape whether the filesystem or the registry database
 * backs it. `Cache-Control: no-store` so a publish surfaces without a rebuild/redeploy.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const type = idFromJsonParam(req.query.type);
    if (!type) {
      sendDocsError(res, 'not_found', 'Missing foundation token type.');
      return;
    }
    const detail = await backend.getTokenSetDetail(`foundation/${type}`);
    if (!detail) {
      sendDocsError(res, 'not_found', `Foundation token set "${type}" was not found.`);
      return;
    }
    const localStylesKey = localStylesKeyForFoundationType(type);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    sendDocsData(res, 200, {
      design: localStylesKey ? { [localStylesKey]: detail.record } : {},
      ...tokenFormatStrings(detail.artifacts),
      artifacts: detail.artifacts,
    });
  });
}
