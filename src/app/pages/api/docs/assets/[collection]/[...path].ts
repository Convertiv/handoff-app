import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { handleDocsRoute, sendDocsError } from '@/lib/docs-api';

/**
 * `GET /api/docs/assets/{collection}/{...path}`: one asset's content, by its logical path
 * (`assets/icons/add.svg`, `icons-sprite.svg`, `icons.zip`, `fonts/Inter.zip`, …). Serves the bytes
 * with the correct `Content-Type`/`Content-Length`, an `ETag` of the content hash, and revalidation
 * caching (stable logical URLs re-validate when their mapped hash changes); object-backed content is
 * redirected to a provider URL. Mode-independent.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const collection = singleQueryValue(req.query.collection);
    const segments = req.query.path;
    const logicalPath = Array.isArray(segments) ? segments.join('/') : segments;
    if (!collection || !logicalPath) {
      sendDocsError(res, 'not_found', 'Missing asset collection or path.');
      return;
    }

    const content = await backend.getAssetContent(collection, logicalPath);
    if (!content) {
      sendDocsError(res, 'artifact_not_found', `Asset "${logicalPath}" was not found in collection "${collection}".`);
      return;
    }

    // Object-backed content: redirect to the provider URL (keeps large payloads out of the function).
    if (content.redirectUrl) {
      res.redirect(302, content.redirectUrl);
      return;
    }
    if (!content.body) {
      sendDocsError(res, 'artifact_not_found', `Asset "${logicalPath}" has no resolvable content.`);
      return;
    }

    const etag = `"${content.contentHash}"`;
    // Logical URLs revalidate against the content-hash ETag so a republish surfaces new bytes.
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('Content-Type', content.contentType);
    res.setHeader('Content-Length', String(content.body.length));
    res.status(200).send(content.body);
  });
}
