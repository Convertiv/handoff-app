import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, listComponents } from '@/lib/docs-api';

/**
 * `GET /api/docs/components.json` — the component list (`ComponentListObject[]`), each record
 * carrying its `path` (technical design §5).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
  res.status(200).json(listComponents());
}
