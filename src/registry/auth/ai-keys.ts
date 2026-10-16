import { and, eq } from 'drizzle-orm';
import type { RegistryDatabase } from '../db/client';
import { registryAiKeys } from '../db/schema';
import { decryptSecret, encryptSecret } from './crypto';

/**
 * Reader-supplied keys for connections the config declares with `credential: 'user'`.
 *
 * The key is write-only across the API boundary: once saved, a read reports only that a key exists.
 * Only the chat route ever decrypts one, and only to send it to the connection's own endpoint.
 */

/**
 * Ids of the connections this reader has a *usable* key for. A row that no longer decrypts — written
 * under a rotated `HANDOFF_AI_KEY_SECRET` — is left out, so the account page and the assistant agree
 * that no key is in place instead of offering a key the provider would never receive.
 */
export const listRegistryAiKeyConnections = async (db: RegistryDatabase, userId: string): Promise<string[]> => {
  const rows = await db
    .select({ connectionId: registryAiKeys.connectionId, encryptedKey: registryAiKeys.encryptedKey })
    .from(registryAiKeys)
    .where(eq(registryAiKeys.userId, userId))
    .orderBy(registryAiKeys.connectionId);
  return rows.filter((row) => decryptSecret(row.encryptedKey) !== null).map((row) => row.connectionId);
};

/** Save or replace this reader's key for one connection. */
export const saveRegistryAiKey = async (
  db: RegistryDatabase,
  input: { userId: string; connectionId: string; key: string }
): Promise<void> => {
  const encryptedKey = encryptSecret(input.key);
  await db
    .insert(registryAiKeys)
    .values({ userId: input.userId, connectionId: input.connectionId, encryptedKey })
    .onConflictDoUpdate({
      target: [registryAiKeys.userId, registryAiKeys.connectionId],
      set: { encryptedKey, updatedAt: new Date() },
    });
};

/** Remove this reader's key for one connection. Returns whether a row was there to remove. */
export const deleteRegistryAiKey = async (db: RegistryDatabase, input: { userId: string; connectionId: string }): Promise<boolean> => {
  const rows = await db
    .delete(registryAiKeys)
    .where(and(eq(registryAiKeys.userId, input.userId), eq(registryAiKeys.connectionId, input.connectionId)))
    .returning({ connectionId: registryAiKeys.connectionId });
  return rows.length > 0;
};

/**
 * Read back one reader's key. A row that no longer decrypts reads as absent, so the reader is told
 * to add a key rather than shown a provider error.
 */
export const readRegistryAiKey = async (db: RegistryDatabase, input: { userId: string; connectionId: string }): Promise<string | null> => {
  const [row] = await db
    .select({ encryptedKey: registryAiKeys.encryptedKey })
    .from(registryAiKeys)
    .where(and(eq(registryAiKeys.userId, input.userId), eq(registryAiKeys.connectionId, input.connectionId)))
    .limit(1);
  return row ? decryptSecret(row.encryptedKey) : null;
};
