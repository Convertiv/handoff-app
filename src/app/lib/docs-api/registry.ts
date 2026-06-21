import { and, eq } from 'drizzle-orm';
import type { ArtifactBuildStatus } from '@handoff/artifacts/types';
import {
  createRegistryDbConnection,
  type RegistryDatabase,
  type RegistryDbConnection,
} from '@handoff/registry/db/client';
import { buildMetadata, docsArtifacts } from '@handoff/registry/db/schema';
import { createRegistryStore } from '@handoff/store/registry';
import { contentTypeForArtifactPath } from './artifacts';
import type { DocsBackend, ResolvedArtifactBody } from './backend';
import { getServerRuntimeConfig } from './runtime-config';

/**
 * Registry-mode backing for the docs read API (technical design §5/§6/§8, issue #10).
 *
 * Everything here resolves from the registry database: normalized records through the DB-backed
 * store (the #3 interface), build state from the `build_metadata` table, and content artifacts from
 * the `docs_artifacts` table. No read path materializes source files or runs the build pipeline.
 * The database connection is created once per server process and reused across requests.
 *
 * Server-only: dynamically imported by {@link resolveDocsBackend} only when `runtime.mode` is
 * `registry`, so the Drizzle/Postgres driver code never loads in workspace dev/build.
 */

let connectionPromise: Promise<RegistryDbConnection> | null = null;

/**
 * Open (or reuse) the registry database connection. The connection string is resolved from the
 * configured env var *name* at request time — never persisted in config — so a missing value
 * surfaces as an actionable error rather than a deep driver failure. A failed connect is not
 * cached, so a later request can retry once the database/env is available.
 */
const getConnection = (): Promise<RegistryDbConnection> => {
  if (connectionPromise) {
    return connectionPromise;
  }
  const { registry } = getServerRuntimeConfig();
  const connectionString = process.env[registry.databaseUrlEnv]?.trim();
  if (!connectionString) {
    return Promise.reject(
      new Error(
        `Registry database URL is not configured. Set the "${registry.databaseUrlEnv}" environment ` +
          `variable to a PostgreSQL connection string to serve the registry-mode docs read API.`
      )
    );
  }
  connectionPromise = createRegistryDbConnection({ adapter: registry.adapter, connectionString }).catch((error) => {
    connectionPromise = null;
    throw error;
  });
  return connectionPromise;
};

/** Whether an artifact exists in the registry by logical path (used for required-reference checks). */
const artifactExists = async (db: RegistryDatabase, path: string): Promise<boolean> => {
  const rows = await db.select({ path: docsArtifacts.path }).from(docsArtifacts).where(eq(docsArtifacts.path, path)).limit(1);
  return rows.length > 0;
};

/**
 * Resolve a content artifact from the registry by logical path. Returns `null` (→ `artifact_not_found`)
 * when the artifact is absent, when its content is stored externally (a future object-storage
 * reference with no inline content), or when a **required** structured reference it depends on is
 * not present — an HTML artifact must never be served with a missing required dependency
 * (technical design §5/§7).
 */
const resolveRegistryArtifact = async (db: RegistryDatabase, segments: string[]): Promise<ResolvedArtifactBody | null> => {
  const artifactPath = segments.join('/');
  const rows = await db.select().from(docsArtifacts).where(eq(docsArtifacts.path, artifactPath)).limit(1);
  const artifact = rows[0];
  if (!artifact || artifact.content == null) {
    return null;
  }

  if (artifact.references) {
    for (const reference of artifact.references) {
      if (reference.required && !(await artifactExists(db, reference.path))) {
        return null;
      }
    }
  }

  const contentType = artifact.contentType || contentTypeForArtifactPath(artifactPath);
  return { contentType, body: artifact.content };
};

/** Build state for an entity: the stored status, or `missing` for a metadata-only record. */
const buildStatusFor = async (
  db: RegistryDatabase,
  entityKind: 'component' | 'pattern',
  entityId: string
): Promise<ArtifactBuildStatus> => {
  const rows = await db
    .select({ status: buildMetadata.status })
    .from(buildMetadata)
    .where(and(eq(buildMetadata.entityKind, entityKind), eq(buildMetadata.entityId, entityId)))
    .limit(1);
  return rows[0]?.status ?? 'missing';
};

/** Construct the registry-mode docs backend over a live database connection. */
export const createRegistryDocsBackend = async (): Promise<DocsBackend> => {
  const connection = await getConnection();
  const { db } = connection;
  const store = createRegistryStore({ db });

  return {
    async listComponents() {
      return store.components.list();
    },
    async listPatterns() {
      return store.patterns.list();
    },
    async getComponentDetail(id: string) {
      const record = await store.components.get(id);
      if (!record) {
        return null;
      }
      return { ...record, build: { status: await buildStatusFor(db, 'component', id) } };
    },
    async getPatternDetail(id: string) {
      const record = await store.patterns.get(id);
      if (!record) {
        return null;
      }
      return { ...record, build: { status: await buildStatusFor(db, 'pattern', id) } };
    },
    async resolveArtifact(segments: string[]) {
      return resolveRegistryArtifact(db, segments);
    },
  };
};
