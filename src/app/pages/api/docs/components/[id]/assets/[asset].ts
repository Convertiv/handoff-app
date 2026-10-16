import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { handleDocsRoute, sendDocsError, serveArtifactBySegments } from '@/lib/docs-api';

/**
 * `GET /api/docs/components/{id}/assets/{asset}` — serves a component asset artifact:
 * `style`→`component/{id}.css`, `script`→`component/{id}.js`,
 * `client`→`component/{id}.client.js`. Unknown asset kinds are `404 not_found`; a known asset with
 * no generated/published artifact is `404 artifact_not_found`. In registry mode the artifact
 * resolves from the database.
 */
const ASSET_FILE_SUFFIX: Record<string, string> = {
  style: 'css',
  script: 'js',
  client: 'client.js',
};

export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const id = singleQueryValue(req.query.id);
    const asset = singleQueryValue(req.query.asset);
    if (!id || !asset) {
      sendDocsError(res, 'not_found', 'Missing component id or asset kind.');
      return;
    }
    const suffix = ASSET_FILE_SUFFIX[asset];
    if (!suffix) {
      sendDocsError(res, 'not_found', `Unknown component asset "${asset}".`);
      return;
    }
    await serveArtifactBySegments(res, ['component', `${id}.${suffix}`], backend);
  });
}
