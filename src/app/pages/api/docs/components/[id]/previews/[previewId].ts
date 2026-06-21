import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, sendDocsError, serveArtifactBySegments, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/components/{id}/previews/{previewId}` — serves the preview HTML artifact
 * `component/{id}-{previewId}.html` (technical design §5). A metadata-only record (no generated
 * preview) yields `404 artifact_not_found`. In registry mode the artifact and its required
 * references resolve from the database.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const id = singleQueryValue(req.query.id);
    const previewId = singleQueryValue(req.query.previewId);
    if (!id || !previewId) {
      sendDocsError(res, 'not_found', 'Missing component id or preview id.');
      return;
    }
    await serveArtifactBySegments(res, ['component', `${id}-${previewId}.html`], backend);
  });
}
