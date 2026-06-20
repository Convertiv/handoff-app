import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, sendDocsError, serveArtifactBySegments, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/components/{id}/previews/{previewId}` — serves the preview HTML artifact
 * `component/{id}-{previewId}.html` (technical design §5). A metadata-only record (no generated
 * preview) yields `404 artifact_not_found`.
 *
 * Reference resolution (resolving an HTML artifact's required references before serving) arrives
 * with the structured-reference build output in a later issue; today the artifact is served as-is.
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
  serveArtifactBySegments(res, ['component', `${id}-${previewId}.html`]);
}
