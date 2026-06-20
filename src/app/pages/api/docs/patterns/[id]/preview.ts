import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, sendDocsError, serveArtifactBySegments, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/patterns/{id}/preview` — serves the pattern preview HTML artifact
 * `pattern/{id}.html` (technical design §5). A metadata-only pattern yields `404 artifact_not_found`.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
  const id = singleQueryValue(req.query.id);
  if (!id) {
    sendDocsError(res, 'not_found', 'Missing pattern id.');
    return;
  }
  serveArtifactBySegments(res, ['pattern', `${id}.html`]);
}
