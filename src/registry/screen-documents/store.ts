import { and, asc, desc, eq, gt, lt, or, sql, type SQL } from 'drizzle-orm';
import type { BackendQuery, CollectionScope, CollectionsBackend, StoredRecord } from '../../screens/store';
import { ScreenDataError } from '../../screens/types';
import type { RegistryDatabase } from '../db/client';
import { documents } from '../db/schema';

// Rows only: the typed store in `src/screens/store.ts` validates documents and decides who may write.

type Row = typeof documents.$inferSelect;

const toRecord = (row: Row): StoredRecord => ({
  id: row.id,
  data: row.data,
  schemaVersion: row.schemaVersion,
  revision: row.revision,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  createdBy: row.createdBy,
  updatedBy: row.updatedBy,
});

const inCollection = (scope: CollectionScope): SQL[] => [
  eq(documents.ownerKind, scope.ownerKind),
  eq(documents.ownerId, scope.ownerId),
  eq(documents.collection, scope.collection),
];

const key = (scope: CollectionScope, id: string): SQL => and(...inCollection(scope), eq(documents.id, id))!;

const identity = (scope: CollectionScope, id: string) => ({
  ownerKind: scope.ownerKind,
  ownerId: scope.ownerId,
  collection: scope.collection,
  id,
});

// Millisecond timestamps, not the database's microseconds: the paging cursor carries an ISO string,
// which would otherwise round below the stored value and repeat a row on the next page.
const now = (): Date => new Date();

const SORT_COLUMNS = {
  createdAt: documents.createdAt,
  updatedAt: documents.updatedAt,
  id: documents.id,
} as const;

/** The registry backing of collections, over the `documents` table. */
export const createRegistryCollectionsBackend = (db: RegistryDatabase): CollectionsBackend => {
  const get = async (scope: CollectionScope, id: string): Promise<StoredRecord | null> => {
    const rows = await db.select().from(documents).where(key(scope, id)).limit(1);
    return rows.length ? toRecord(rows[0]) : null;
  };

  return {
    get,

    async list(scope, query: BackendQuery) {
      const column = SORT_COLUMNS[query.sort];
      const conditions: SQL[] = inCollection(scope);
      // `@>` with the whole filter object uses the GIN `jsonb_path_ops` index.
      if (Object.keys(query.where).length > 0) conditions.push(sql`${documents.data} @> ${JSON.stringify(query.where)}::jsonb`);
      if (query.after) {
        const value = query.sort === 'id' ? query.after.value : new Date(query.after.value);
        const beyond = query.order === 'asc' ? gt : lt;
        conditions.push(or(beyond(column, value), and(eq(column, value), beyond(documents.id, query.after.id)))!);
      }
      const direction = query.order === 'asc' ? asc : desc;
      const rows = await db
        .select()
        .from(documents)
        .where(and(...conditions))
        .orderBy(direction(column), direction(documents.id))
        .limit(query.limit + 1);
      return rows.map(toRecord);
    },

    async write(scope, input, { expectedRevision, actor }) {
      const data = input.data as Record<string, unknown>;
      if (expectedRevision === 0) {
        const rows = await db
          .insert(documents)
          .values({
            ...identity(scope, input.id),
            data,
            schemaVersion: input.schemaVersion,
            createdBy: actor,
            updatedBy: actor,
            createdAt: now(),
            updatedAt: now(),
          })
          .onConflictDoNothing()
          .returning();
        if (!rows.length) throw new ScreenDataError('conflict', `Document "${input.id}" already exists.`);
        return toRecord(rows[0]);
      }
      if (expectedRevision !== undefined) {
        const rows = await db
          .update(documents)
          .set({
            data,
            schemaVersion: input.schemaVersion,
            revision: sql`${documents.revision} + 1`,
            updatedBy: actor,
            updatedAt: now(),
          })
          .where(and(key(scope, input.id), eq(documents.revision, expectedRevision)))
          .returning();
        if (!rows.length) {
          const exists = await get(scope, input.id);
          throw exists
            ? new ScreenDataError(
                'conflict',
                `Document "${input.id}" changed since revision ${expectedRevision}; it is at revision ${exists.revision}.`
              )
            : new ScreenDataError('not_found', `Document "${input.id}" does not exist.`);
        }
        return toRecord(rows[0]);
      }
      const rows = await db
        .insert(documents)
        .values({
          ...identity(scope, input.id),
          data,
          schemaVersion: input.schemaVersion,
          createdBy: actor,
          updatedBy: actor,
          createdAt: now(),
          updatedAt: now(),
        })
        .onConflictDoUpdate({
          target: [documents.ownerKind, documents.ownerId, documents.collection, documents.id],
          set: {
            data,
            schemaVersion: input.schemaVersion,
            revision: sql`${documents.revision} + 1`,
            updatedBy: actor,
            updatedAt: now(),
          },
        })
        .returning();
      return toRecord(rows[0]);
    },

    async remove(scope, id, { expectedRevision }) {
      const condition =
        expectedRevision === undefined ? key(scope, id) : and(key(scope, id), eq(documents.revision, expectedRevision));
      const rows = await db.delete(documents).where(condition).returning({ id: documents.id });
      if (!rows.length && expectedRevision !== undefined && (await get(scope, id))) {
        throw new ScreenDataError('conflict', `Document "${id}" changed since revision ${expectedRevision}.`);
      }
      return rows.length > 0;
    },
  };
};
