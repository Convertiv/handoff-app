/** Route facing docs API helpers. Backend and filesystem details stay in their own modules. */

export { ensureGet, idFromJsonParam, sendDocsError, type DocsErrorCode } from './errors';
export { serveArtifactBySegments } from './serve';
export { handleDocsRoute } from './handler';
export { resolveDocsBackend } from './backend';
export { getServerRuntimeConfig, type ServerRuntimeConfig } from './runtime-config';
