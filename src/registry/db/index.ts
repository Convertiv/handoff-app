export {
  buildMetadata,
  componentFiles,
  components,
  docsArtifacts,
  patternFiles,
  patterns,
  registryAccessTokens,
  registryAuthActionTokens,
  registryAuthRateLimits,
  registryDeviceAuthorizations,
  registryInstallations,
  registrySchema,
  registryUsers,
  type BuildMetadataEntityKind,
  type DocsArtifactEntityKind,
  type RegistryAccessScope,
  type RegistryAuthActionPurpose,
  type RegistryDeviceAuthorizationStatus,
  type RegistryRateLimitBucket,
  type RegistryReviewMetadata,
  type RegistryUserRole,
  type RegistryUserStatus,
} from './schema';

export type { ArtifactBuildStatus as RegistryBuildStatus } from '../../artifacts/types';

export {
  DEFAULT_DATABASE_URL_ENV,
  DEFAULT_REGISTRY_DRIVER,
  DEFAULT_REGISTRY_API_TOKEN_ENV,
  resolveApiTokenEnv,
  resolveDatabaseUrlEnv,
  resolveRegistryDriver,
  resolveRegistryDatabase,
  type RegistryDatabaseDriver,
  type ResolvedRegistryDatabase,
} from './driver';

export {
  createRegistryDbConnection,
  type CreateRegistryDbConnectionParams,
  type RegistryDatabase,
  type RegistryDbConnection,
} from './client';

export { getMigrationsFolder, runRegistryMigrations } from './migrate';
