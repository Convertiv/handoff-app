import { sql } from 'drizzle-orm';
import type { RegistryDatabase } from '../db/client';

export type RegistryTransaction = RegistryDatabase;

export const withRegistryTransaction = async <T>(db: RegistryDatabase, callback: (tx: RegistryTransaction) => Promise<T>): Promise<T> =>
  (db as any).transaction((tx: unknown) => callback(tx as RegistryTransaction));

export const acquireRegistryAdvisoryLock = async (tx: RegistryTransaction, lockId: number): Promise<void> => {
  await tx.execute(sql`select pg_advisory_xact_lock(${lockId})`);
};

/** Stable, package-owned Postgres advisory-lock ids. */
export const REGISTRY_INSTALL_LOCK_ID = 1_841_111_001;
export const REGISTRY_ADMIN_LOCK_ID = 1_841_111_002;
