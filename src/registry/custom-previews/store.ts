import { asc, eq, inArray } from 'drizzle-orm';
import type { RegistryDatabase } from '../db/client';
import { componentCustomPreviews, registryUsers } from '../db/schema';

// Rows only: callers check args and decide who may change a row.

export interface CustomPreviewRow {
  id: string;
  componentId: string;
  title: string;
  description: string | null;
  args: Record<string, unknown>;
  contractFingerprint: string;
  createdBy: { id: string; name: string | null } | null;
  updatedBy: { id: string; name: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}

type Row = typeof componentCustomPreviews.$inferSelect;

const withAuthors = async (db: RegistryDatabase, rows: Row[]): Promise<CustomPreviewRow[]> => {
  const userIds = [...new Set(rows.flatMap((row) => [row.createdBy, row.updatedBy]).filter((id): id is string => Boolean(id)))];
  const users = userIds.length
    ? await db.select({ id: registryUsers.id, name: registryUsers.name }).from(registryUsers).where(inArray(registryUsers.id, userIds))
    : [];
  const byId = new Map(users.map((user) => [user.id, user]));
  const author = (id: string | null) => (id ? (byId.get(id) ?? { id, name: null }) : null);

  return rows.map((row) => ({
    id: row.id,
    componentId: row.componentId,
    title: row.title,
    description: row.description,
    args: row.args,
    contractFingerprint: row.contractFingerprint,
    createdBy: author(row.createdBy),
    updatedBy: author(row.updatedBy),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
};

export const listCustomPreviewRows = async (db: RegistryDatabase, componentId: string): Promise<CustomPreviewRow[]> => {
  const rows = await db
    .select()
    .from(componentCustomPreviews)
    .where(eq(componentCustomPreviews.componentId, componentId))
    .orderBy(asc(componentCustomPreviews.createdAt));
  return withAuthors(db, rows);
};

export const getCustomPreviewRow = async (db: RegistryDatabase, id: string): Promise<CustomPreviewRow | null> => {
  const rows = await db.select().from(componentCustomPreviews).where(eq(componentCustomPreviews.id, id)).limit(1);
  return rows.length ? (await withAuthors(db, rows))[0] : null;
};

export interface InsertCustomPreviewInput {
  componentId: string;
  title: string;
  description: string | null;
  args: Record<string, unknown>;
  contractFingerprint: string;
  userId: string;
}

export const insertCustomPreviewRow = async (db: RegistryDatabase, input: InsertCustomPreviewInput): Promise<CustomPreviewRow> => {
  const [row] = await db
    .insert(componentCustomPreviews)
    .values({
      componentId: input.componentId,
      title: input.title,
      description: input.description,
      args: input.args,
      contractFingerprint: input.contractFingerprint,
      createdBy: input.userId,
      updatedBy: input.userId,
    })
    .returning();
  return (await withAuthors(db, [row]))[0];
};

export interface UpdateCustomPreviewInput {
  title?: string;
  description?: string | null;
  args?: Record<string, unknown>;
  contractFingerprint?: string;
  userId: string;
}

export const updateCustomPreviewRow = async (
  db: RegistryDatabase,
  id: string,
  input: UpdateCustomPreviewInput
): Promise<CustomPreviewRow | null> => {
  const { userId, ...fields } = input;
  const set = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  const rows = await db
    .update(componentCustomPreviews)
    .set({ ...set, updatedBy: userId, updatedAt: new Date() })
    .where(eq(componentCustomPreviews.id, id))
    .returning();
  return rows.length ? (await withAuthors(db, rows))[0] : null;
};

export const deleteCustomPreviewRow = async (db: RegistryDatabase, id: string): Promise<boolean> => {
  const rows = await db.delete(componentCustomPreviews).where(eq(componentCustomPreviews.id, id)).returning({ id: componentCustomPreviews.id });
  return rows.length > 0;
};
