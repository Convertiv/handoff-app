import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, sendDocsData } from '@/lib/docs-api';

/**
 * `GET /api/docs/patterns.json` — the pattern list (`PatternListObject[]`).
 * Identical shape in workspace and registry mode.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    sendDocsData(res, 200, await backend.listPatterns());
  });
}
