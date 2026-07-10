import { and, eq, inArray } from 'drizzle-orm';
import matter from 'gray-matter';
import type { ArtifactBuildStatus } from '@handoff/artifacts/types';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { buildMetadata, docsArtifacts } from '@handoff/registry/db/schema';
import { createRegistryStore } from '@handoff/store/registry';
import { contentTypeForArtifactPath } from './artifacts';
import type { DocsBackend, ResolvedArtifactBody } from './backend';
import { getRegistryConnection } from '../registry-connection';
import { getAssetStorageAdapter } from '../asset-storage';

/**
 * Registry-mode backing for the docs read API.
 *
 * Everything here resolves from the registry database: normalized records through the DB-backed
 * store, build state from the `build_metadata` table, and content artifacts from
 * the `docs_artifacts` table. No read path materializes source files or runs the build pipeline.
 * The database connection is created once per server process and reused across requests.
 *
 * Server-only: dynamically imported by {@link resolveDocsBackend} only when `runtime.mode` is
 * `registry`, so the Drizzle/Postgres driver code never loads in workspace dev/build.
 */

/**
 * Resolve a content artifact from the registry by logical path. Returns `null` (→ `artifact_not_found`)
 * when the artifact is absent, when its content is stored externally (a future object-storage
 * reference with no inline content), or when a **required** structured reference it depends on is
 * not present — an HTML artifact must never be served with a missing required dependency.
 */
const resolveRegistryArtifact = async (db: RegistryDatabase, segments: string[]): Promise<ResolvedArtifactBody | null> => {
  const artifactPath = segments.join('/');
  const rows = await db.select().from(docsArtifacts).where(eq(docsArtifacts.path, artifactPath)).limit(1);
  const artifact = rows[0];
  if (!artifact || artifact.content == null) {
    return null;
  }

  const requiredPaths = Array.from(
    new Set((artifact.references ?? []).filter((reference) => reference.required).map((reference) => reference.path))
  );
  if (requiredPaths.length > 0) {
    const rows = await db
      .select({ path: docsArtifacts.path, content: docsArtifacts.content })
      .from(docsArtifacts)
      .where(inArray(docsArtifacts.path, requiredPaths));
    if (rows.filter(({ content }) => content != null).length !== requiredPaths.length) {
      return null;
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
  const connection = await getRegistryConnection();
  const { db } = connection;
  // Inject the storage-adapter resolver so object-backed asset content resolves by provider id.
  const store = createRegistryStore({ db, resolveAssetAdapter: getAssetStorageAdapter });

  return {
    async listComponents() {
      return store.components.list();
    },
    async listPatterns() {
      return store.patterns.list();
    },
    async listPages() {
      return store.pages.list();
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
    async getPageDetail(id: string) {
      const record = await store.pages.get(id);
      if (!record) {
        return null;
      }
      // The markdown body travels as the page's single source file; parse it to drop the frontmatter.
      const files = await store.pages.getRelatedSourceFiles(id);
      const { content } = matter(files[0]?.content ?? '');
      return { ...record, content };
    },
    async resolveArtifact(segments: string[]) {
      return resolveRegistryArtifact(db, segments);
    },
    async listTokenSets() {
      return (await store.tokens.listSets()).map(({ id, kind }) => ({ id, kind }));
    },
    async getTokenSetDetail(id: string) {
      const set = await store.tokens.getSet(id);
      if (!set) {
        return null;
      }
      return { id: set.id, kind: set.kind, record: set.record, artifacts: await store.tokens.getArtifacts(id) };
    },
    async listAssets(collection: string) {
      return store.assets.listAssets(collection);
    },
    async getAssetContent(collection: string, assetPath: string) {
      return store.assets.getAssetContent(collection, assetPath);
    },
  };
};
