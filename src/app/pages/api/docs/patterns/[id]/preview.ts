import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, sendDocsError, serveArtifactBySegments, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/patterns/{id}/preview` — serves the pattern preview HTML artifact
 * `pattern/{id}.html`. A metadata-only pattern yields `404 artifact_not_found`.
 * In registry mode the artifact resolves from the database.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const id = singleQueryValue(req.query.id);
    if (!id) {
      sendDocsError(res, 'not_found', 'Missing pattern id.');
      return;
    }
    await serveArtifactBySegments(res, ['pattern', `${id}.html`], backend);
  });
}
