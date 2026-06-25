import type { NextApiResponse } from 'next';
import { validateArtifactSegments } from './artifacts';
import type { DocsBackend } from './backend';
import { sendDocsError } from './errors';

/**
 * Serve a logical artifact by its path segments, applying the docs read API contract end to end:
 *
 * - traversal/malformed segments → `404 not_found`
 * - an artifact the backend cannot serve → `404 artifact_not_found`
 * - otherwise the raw body with the resolved `Content-Type`
 *
 * Segment validation is mode-independent and stays here; the actual artifact lookup is delegated to
 * the active {@link DocsBackend} (filesystem in workspace mode, database in registry mode), so the
 * canonical artifact route and the convenience preview/inspect/asset routes all produce identical
 * responses regardless of which URL or which mode reached them.
 */
export const serveArtifactBySegments = async (
  res: NextApiResponse,
  rawSegments: string[] | undefined,
  backend: DocsBackend
): Promise<void> => {
  const validation = validateArtifactSegments(rawSegments);
  if (!validation.ok) {
    sendDocsError(res, 'not_found', validation.reason ?? 'Invalid artifact path.');
    return;
  }

  const resolved = await backend.resolveArtifact(validation.segments);
  if (!resolved) {
    sendDocsError(res, 'artifact_not_found', `Artifact "${validation.segments.join('/')}" was not found.`);
    return;
  }

  res.setHeader('Content-Type', resolved.contentType);
  res.status(200).send(resolved.body);
};
