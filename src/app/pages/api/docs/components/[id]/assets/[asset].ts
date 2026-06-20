import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, sendDocsError, serveArtifactBySegments, singleQueryValue } from '@/lib/docs-api';

/**
 * `GET /api/docs/components/{id}/assets/{asset}` — serves a component asset artifact
 * (technical design §5): `style`→`component/{id}.css`, `script`→`component/{id}.js`,
 * `client`→`component/{id}.client.js`. Unknown asset kinds are `404 not_found`; a known asset with
 * no generated artifact is `404 artifact_not_found`.
 */
const ASSET_FILE_SUFFIX: Record<string, string> = {
  style: 'css',
  script: 'js',
  client: 'client.js',
};

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
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
  serveArtifactBySegments(res, ['component', `${id}.${suffix}`]);
}
