import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute, serveArtifactBySegments } from '@/lib/docs-api';

/**
 * Canonical artifact route — `GET {basePath}/api/docs/artifacts/{artifactPath}` (technical design §6).
 * Serves CSS/JS/HTML/JSON/text artifacts by logical path with traversal rejection and correct
 * content types. Every artifact reference in generated HTML and docs read data resolves here, from
 * the filesystem in workspace mode and from the database in registry mode.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const { artifactPath } = req.query;
    const segments = Array.isArray(artifactPath) ? artifactPath : artifactPath ? [artifactPath] : undefined;
    await serveArtifactBySegments(res, segments, backend);
  });
}
