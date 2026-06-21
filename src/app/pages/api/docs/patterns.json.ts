import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute } from '@/lib/docs-api';

/**
 * `GET /api/docs/patterns.json` — the pattern list (`PatternListObject[]`) (technical design §5).
 * Identical shape in workspace and registry mode.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    res.status(200).json(await backend.listPatterns());
  });
}
