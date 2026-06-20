import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, listPatterns } from '@/lib/docs-api';

/**
 * `GET /api/docs/patterns.json` — the pattern list (`PatternListObject[]`) (technical design §5).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
  res.status(200).json(listPatterns());
}
