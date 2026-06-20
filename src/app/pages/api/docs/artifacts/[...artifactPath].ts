import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, serveArtifactBySegments } from '@/lib/docs-api';

/**
 * Canonical artifact route — `GET {basePath}/api/docs/artifacts/{artifactPath}` (technical design §6).
 * Serves CSS/JS/HTML/JSON/text artifacts by logical path with traversal rejection and correct
 * content types. Every artifact reference in generated HTML and docs read data resolves here.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureGet(req, res)) {
    return;
  }
  const { artifactPath } = req.query;
  const segments = Array.isArray(artifactPath) ? artifactPath : artifactPath ? [artifactPath] : undefined;
  serveArtifactBySegments(res, segments);
}
