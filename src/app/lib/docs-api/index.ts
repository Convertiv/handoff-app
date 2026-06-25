/**
 * Workspace-mode docs read API. Server-only helpers shared by the
 * `/api/docs/*` route handlers: GET guards and the error envelope, canonical artifact resolution
 * and serving, and metadata list/detail reads. Consumers depend only on these helpers, so the
 * registry-backed implementation can replace the data source without changing the routes.
 */

export { ensureGet, idFromJsonParam, sendDocsError, singleQueryValue, type DocsErrorCode } from './errors';
export {
  contentTypeForArtifactPath,
  getArtifactRoot,
  resolveArtifactFile,
  validateArtifactSegments,
  type ResolvedArtifact,
} from './artifacts';
export { serveArtifactBySegments } from './serve';
export { handleDocsRoute } from './handler';
export { resolveDocsBackend, type DocsBackend, type ResolvedArtifactBody } from './backend';
export { getServerRuntimeConfig, type ServerRuntimeConfig } from './runtime-config';
export {
  getComponentDetail,
  getPatternDetail,
  listComponents,
  listPatterns,
  type ComponentDetail,
  type PatternDetail,
} from './records';
