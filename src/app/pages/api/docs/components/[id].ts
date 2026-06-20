import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, getComponentDetail, idFromJsonParam, sendDocsError } from '@/lib/docs-api';

/**
 * `GET /api/docs/components/{id}.json` — a single `ComponentListObject` including build state;
 * `404 not_found` when the component does not exist (technical design §5). The dynamic param
 * carries the explicit `.json` extension, which is stripped to recover the id.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
  const id = idFromJsonParam(req.query.id);
  if (!id) {
    sendDocsError(res, 'not_found', 'Missing component id.');
    return;
  }
  const detail = getComponentDetail(id);
  if (!detail) {
    sendDocsError(res, 'not_found', `Component "${id}" was not found.`);
    return;
  }
  res.status(200).json(detail);
}
