import { and, eq, exists, inArray, lt, not, notExists, or, sql, type SQL } from 'drizzle-orm';
import { alias, type AnyPgColumn } from 'drizzle-orm/pg-core';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { assetBlobs, assets, components, docsArtifacts, patterns } from '@handoff/registry/db/schema';
import { deleteUnusedBlobs } from './blobs';

/**
 * Bounded deletion of registry data that nothing uses. Data becomes unused only through a write, so
 * the registry runs one pass after each entity publish, entity delete, and asset collection publish.
 * A pass deletes at most `limit` rows per table, and existing unused data goes over later passes.
 *
 * Data is deleted only after a grace period. It protects a write that is still in progress: a
 * publish that has uploaded blobs but not yet sent the package or manifest that uses them, or a
 * pattern publish that is rewriting a component's rows in an open transaction. The artifact `DELETE`
 * repeats the age check, so PostgreSQL re-checks a row that a concurrent publish updated and keeps it.
 */

const PRUNE_LIMIT = 100;
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

type ArtifactOwnerColumns = { ownerKind: AnyPgColumn; ownerId: AnyPgColumn };

/** Whether the component or pattern that owns an artifact row exists. Never null, so it can be negated. */
const ownerExists = (db: RegistryDatabase, artifact: ArtifactOwnerColumns): SQL =>
  or(
    exists(
      db
        .select({ id: components.id })
        .from(components)
        .where(and(eq(artifact.ownerKind, 'component'), eq(components.id, artifact.ownerId)))
    ),
    exists(
      db
        .select({ id: patterns.id })
        .from(patterns)
        .where(and(eq(artifact.ownerKind, 'pattern'), eq(patterns.id, artifact.ownerId)))
    )
  ) as SQL;

/**
 * Whether a live HTML artifact (one whose owner exists) lists `path` in its references. One level is
 * enough: HTML references client, style, script, and shared files, which reference nothing.
 */
export const referencedByLiveHtml = (db: RegistryDatabase, path: AnyPgColumn): SQL => {
  const html = alias(docsArtifacts, 'referencing_html');
  return exists(
    db
      .select({ path: html.path })
      .from(html)
      .where(
        and(
          eq(html.artifactKind, 'html'),
          sql`${html.references} @> jsonb_build_array(jsonb_build_object('path', ${path}))`,
          ownerExists(db, html)
        )
      )
  );
};

const pruneBlobs = async (db: RegistryDatabase, limit: number, cutoff: Date): Promise<void> => {
  const unused = await db
    .select({ hash: assetBlobs.hash })
    .from(assetBlobs)
    .where(
      and(
        lt(assetBlobs.createdAt, cutoff),
        notExists(db.select({ hash: assets.blobHash }).from(assets).where(eq(assets.blobHash, assetBlobs.hash)))
      )
    )
    .limit(limit);
  await deleteUnusedBlobs(
    db,
    unused.map((row) => row.hash)
  );
};

/** Delete artifact rows whose owner is gone and that no live HTML references. Shared rows are live only through references. */
const pruneArtifacts = async (db: RegistryDatabase, limit: number, cutoff: Date): Promise<void> => {
  const unused = and(
    lt(docsArtifacts.updatedAt, cutoff),
    not(ownerExists(db, docsArtifacts)),
    not(referencedByLiveHtml(db, docsArtifacts.path))
  );
  const candidates = await db.select({ path: docsArtifacts.path }).from(docsArtifacts).where(unused).limit(limit);
  if (candidates.length === 0) return;
  await db.delete(docsArtifacts).where(
    and(
      inArray(
        docsArtifacts.path,
        candidates.map((row) => row.path)
      ),
      unused
    )
  );
};

/** Run one prune pass. A failure is logged and never fails the write that triggered it. */
export const pruneRegistry = async (db: RegistryDatabase, { limit = PRUNE_LIMIT }: { limit?: number } = {}): Promise<void> => {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);
  try {
    await pruneBlobs(db, limit, cutoff);
  } catch (error) {
    console.warn('The registry prune pass could not delete unused blobs.', error);
  }
  try {
    await pruneArtifacts(db, limit, cutoff);
  } catch (error) {
    console.warn('The registry prune pass could not delete unused artifact rows.', error);
  }
};
