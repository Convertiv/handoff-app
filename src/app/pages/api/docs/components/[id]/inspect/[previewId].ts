import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, sendDocsError, serveArtifactBySegments, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/components/{id}/inspect/{previewId}` — serves the inspect HTML artifact
 * `component/{id}-{previewId}-inspect.html` (technical design §5). A metadata-only record yields
 * `404 artifact_not_found`.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
  const id = singleQueryValue(req.query.id);
  const previewId = singleQueryValue(req.query.previewId);
  if (!id || !previewId) {
    sendDocsError(res, 'not_found', 'Missing component id or preview id.');
    return;
  }
  serveArtifactBySegments(res, ['component', `${id}-${previewId}-inspect.html`]);
}
