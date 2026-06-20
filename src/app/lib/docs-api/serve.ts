import fs from 'fs-extra';
import type { NextApiResponse } from 'next';
import { resolveArtifactFile, validateArtifactSegments } from './artifacts';
import { sendDocsError } from './errors';

/**
 * Serve a logical artifact by its path segments, applying the docs read API contract end to end
 * (technical design §5/§6/§12):
 *
 * - traversal/malformed segments → `404 not_found`
 * - a non-existent artifact file → `404 artifact_not_found`
 * - otherwise the raw body with the extension-derived `Content-Type`
 *
 * Both the canonical artifact route and the convenience preview/inspect/asset routes delegate here
 * so every artifact response is identical regardless of which URL reached it.
 */
export const serveArtifactBySegments = (res: NextApiResponse, rawSegments: string[] | undefined): void => {
  const validation = validateArtifactSegments(rawSegments);
  if (!validation.ok) {
    sendDocsError(res, 'not_found', validation.reason ?? 'Invalid artifact path.');
    return;
  }

  const resolved = resolveArtifactFile(validation.segments);
  if (!resolved) {
    sendDocsError(res, 'artifact_not_found', `Artifact "${validation.segments.join('/')}" was not found.`);
    return;
  }

  res.setHeader('Content-Type', resolved.contentType);
  res.status(200).send(fs.readFileSync(resolved.absolutePath));
};
