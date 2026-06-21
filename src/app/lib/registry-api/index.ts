/**
 * Registry management API (technical design §9, issue #12). Server-only helpers shared by the
 * `/api/registry/*` route handlers: the runtime-mode + bearer-token + database guard stack and the
 * `{ data, meta }` envelope, the metadata allowlist and file-record validation, secret redaction,
 * and the database operations the management endpoints are expressed in terms of.
 *
 * The whole surface is registry-runtime-only: every route runs behind {@link handleRegistryRoute}
 * (or {@link ensureRegistryMode}), which returns `409 runtime_mode_conflict` in workspace mode, so
 * the Drizzle/Postgres dependencies these modules pull in never load on the workspace/static path.
 */

export {
  ensureRegistryMode,
  handleRegistryRoute,
  sendRegistryData,
  type RegistryRouteContext,
} from './handler';
export { sendRegistryError, type RegistryErrorCode, type RegistryErrorDetails } from './errors';
export { buildMeta, resolveBuildMeta, type RegistryBuildMeta, type RegistryMeta } from './meta';
export {
  mergeReviewMetadata,
  validateMetadataWrite,
  type ManagedEntityKind,
  type MetadataValidation,
  type ValidatedMetadataWrite,
} from './allowlist';
export { isSafeRelativePath, normalizeRelativePath, validateFileBody, type ValidatedFile } from './files';
export { redactSecrets } from './redact';
export {
  createEntity,
  deleteEntity,
  deleteEntityFile,
  entityExists,
  getEntity,
  getEntityFile,
  listEntities,
  listEntityFiles,
  updateEntityMetadata,
  upsertEntityFile,
  type EntityReadResult,
  type RegistryEntityData,
} from './store';
