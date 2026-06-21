import { and, eq, sql } from 'drizzle-orm';
import type { RuntimeMode } from '@handoff/types/config';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { buildMetadata, docsArtifacts } from '@handoff/registry/db/schema';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';

/**
 * Response-envelope `meta` for the registry management API (technical design §9).
 *
 * Every registry API response — success or error — carries `{ data, meta }`, where `meta` describes
 * the serving runtime and (for single-entity reads) the entity's build/artifact state. The build
 * block lets a reviewer see whether an entity has published artifacts without fetching them.
 */

/** Build/artifact state summary for a single entity. */
export interface RegistryBuildMeta {
  /** `not_built` when no build-metadata row exists yet; otherwise the stored status. */
  status: 'current' | 'stale' | 'missing' | 'error' | 'not_built';
  entityKind: 'component' | 'pattern';
  entityId: string;
  builtAt: string | null;
  artifactHash: string | null;
  /** Number of entity-owned docs read-model artifacts stored. */
  ingestedArtifacts: number;
  /** Number of shared/global artifacts stored (path-keyed, owned by `asset`). */
  sharedArtifacts: number;
}

/** Standard registry API response meta. */
export interface RegistryMeta {
  runtime: RuntimeMode;
  source: 'database';
  generatedAt: string;
  build?: RegistryBuildMeta;
}

/** Build the base response meta, optionally carrying a single entity's build state. */
export const buildMeta = (build?: RegistryBuildMeta): RegistryMeta => ({
  runtime: getServerRuntimeConfig().mode,
  source: 'database',
  generatedAt: new Date().toISOString(),
  ...(build ? { build } : {}),
});

/** Count rows matching a where-clause (used for artifact tallies). */
const countWhere = async (db: RegistryDatabase, where: ReturnType<typeof eq>): Promise<number> => {
  const rows = await db.select({ value: sql<number>`count(*)::int` }).from(docsArtifacts).where(where);
  return rows[0]?.value ?? 0;
};

/**
 * Resolve the build/artifact state for an entity from `build_metadata` + `docs_artifacts`. Reads
 * only — never triggers a build. A metadata-only entity (no build row) reports `not_built`.
 */
export const resolveBuildMeta = async (
  db: RegistryDatabase,
  entityKind: 'component' | 'pattern',
  entityId: string
): Promise<RegistryBuildMeta> => {
  const rows = await db
    .select({
      status: buildMetadata.status,
      builtAt: buildMetadata.builtAt,
      artifactHash: buildMetadata.artifactHash,
    })
    .from(buildMetadata)
    .where(and(eq(buildMetadata.entityKind, entityKind), eq(buildMetadata.entityId, entityId)))
    .limit(1);
  const row = rows[0];

  const ingestedArtifacts = await countWhere(
    db,
    and(eq(docsArtifacts.entityKind, entityKind), eq(docsArtifacts.entityId, entityId))
  );
  const sharedArtifacts = await countWhere(db, eq(docsArtifacts.entityKind, 'asset'));

  return {
    status: row?.status ?? 'not_built',
    entityKind,
    entityId,
    builtAt: row?.builtAt ? new Date(row.builtAt).toISOString() : null,
    artifactHash: row?.artifactHash ?? null,
    ingestedArtifacts,
    sharedArtifacts,
  };
};
