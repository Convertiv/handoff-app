// Registry database storage (Drizzle / PostgreSQL)

// Schema + record-group tables
export {
  buildMetadata,
  componentFiles,
  components,
  docsArtifacts,
  patternFiles,
  patterns,
  registrySchema,
  type BuildMetadataEntityKind,
  type DocsArtifactEntityKind,
  type RegistryBuildStatus,
  type RegistryTextFileKind,
} from './schema';

// Adapter resolution
export {
  DEFAULT_DATABASE_URL_ENV,
  DEFAULT_REGISTRY_ADAPTER,
  resolveDatabaseUrlEnv,
  resolveRegistryAdapter,
  resolveRegistryDatabase,
  type RegistryDatabaseAdapter,
  type ResolvedRegistryDatabase,
} from './adapter';

// Bundled Drizzle client + migrator
export {
  createRegistryDbConnection,
  type CreateRegistryDbConnectionParams,
  type RegistryDatabase,
  type RegistryDbConnection,
} from './client';

// Migration runner
export { getMigrationsFolder, runRegistryMigrations } from './migrate';
