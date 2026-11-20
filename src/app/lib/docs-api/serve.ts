import type { NextApiResponse } from 'next';
import {
  CANVAS_DOCUMENT_PATH,
  CLIENT_ARTIFACT_SUFFIX,
  CUSTOM_PREVIEW_CONTENT_SECURITY_POLICY,
  RENDER_SHELL_SUFFIX,
  generateCanvasDocument,
} from '@handoff/custom-previews';
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

  // The canvas is part of the app, not of a build, so every mode serves it without a stored artifact.
  const isCanvas = validation.segments.length === 1 && validation.segments[0] === CANVAS_DOCUMENT_PATH;
  const resolved = isCanvas
    ? { contentType: 'text/html; charset=utf-8', body: generateCanvasDocument(process.env.HANDOFF_APP_BASE_PATH) }
    : await backend.resolveArtifact(validation.segments);
  if (!resolved) {
    sendDocsError(res, 'artifact_not_found', `Artifact "${validation.segments.join('/')}" was not found.`);
    return;
  }

  const fileName = validation.segments[validation.segments.length - 1] ?? '';
  // The shell runs args from any member, so even a direct navigation runs sandboxed, not as the registry.
  if (fileName.endsWith(RENDER_SHELL_SUFFIX)) {
    res.setHeader('Content-Security-Policy', CUSTOM_PREVIEW_CONTENT_SECURITY_POLICY);
  }
  // The sandboxed shell loads this bundle, and the canvas reads each render shell, from origin `null`.
  // Both are public build output and are sent without credentials.
  if (fileName.endsWith(CLIENT_ARTIFACT_SUFFIX) || fileName.endsWith(RENDER_SHELL_SUFFIX)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Content-Type', resolved.contentType);
  res.status(200).send(resolved.body);
};
