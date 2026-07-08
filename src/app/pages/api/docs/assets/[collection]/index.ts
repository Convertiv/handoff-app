import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, sendDocsError, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/assets/{collection}`: lightweight metadata for every asset in a collection. Never
 * carries a binary/SVG body: bodies are fetched one at a time via the `[...path]` content route, and
 * the icon grid uses the published sprite. Mode-independent; `Cache-Control: no-store` so a publish
 * surfaces without a rebuild/redeploy.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const collection = singleQueryValue(req.query.collection);
    if (!collection) {
      sendDocsError(res, 'not_found', 'Missing asset collection.');
      return;
    }
    const assets = await backend.listAssets(collection);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).json({ collection, assets });
  });
}
