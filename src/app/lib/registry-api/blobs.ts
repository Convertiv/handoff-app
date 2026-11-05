import { and, eq, inArray, notExists } from 'drizzle-orm';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { assetBlobs, assets, type AssetStorageProvider } from '@handoff/registry/db/schema';
import { getActiveAssetStorage, getStorageProvider } from '../asset-storage';

/**
 * Server-side reads and deletes of content-addressed asset blobs. Asset collections reference blobs
 * for as long as they use them. An entity publish uses a blob only to carry a large artifact, and the
 * registry deletes the blob once the artifact is stored.
 */

/** The `asset_blobs` columns needed to read a blob's bytes. */
export interface StoredBlob {
  hash: string;
  storageProvider: AssetStorageProvider;
  content: Buffer | null;
  storageRef: string | null;
}

const readStream = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

/** Read a blob's bytes: inline content, or the stored object through its provider. */
export const readBlobBytes = async (blob: StoredBlob): Promise<Buffer> => {
  if (blob.content != null) {
    return Buffer.from(blob.content);
  }
  if (!blob.storageRef) {
    throw new Error(`Blob "${blob.hash}" has no resolvable content.`);
  }
  const storage = await getStorageProvider(blob.storageProvider);
  if (!storage) {
    throw new Error(`No asset storage is available for provider "${blob.storageProvider}".`);
  }
  const result = await storage.get(blob.storageRef);
  if (result.kind === 'bytes') {
    return result.bytes;
  }
  if (result.kind === 'stream') {
    return readStream(result.stream);
  }
  const response = await fetch(result.url);
  if (!response.ok) {
    throw new Error(`Storage returned HTTP ${response.status} for blob "${blob.hash}".`);
  }
  return Buffer.from(await response.arrayBuffer());
};

/**
 * Delete the given blobs that no asset uses. The row goes first: once it is gone, no asset can
 * reference the blob, so a failed object delete leaves only an orphaned object, which is logged.
 * Blobs of a provider that is no longer configured are kept, because their objects cannot be reached.
 */
export const deleteUnusedBlobs = async (db: RegistryDatabase, hashes: string[]): Promise<void> => {
  if (hashes.length === 0) return;

  const providers = Array.from(new Set<AssetStorageProvider>(['database', getActiveAssetStorage().provider]));
  const deleted = await db
    .delete(assetBlobs)
    .where(
      and(
        inArray(assetBlobs.hash, hashes),
        inArray(assetBlobs.storageProvider, providers),
        notExists(db.select({ hash: assets.blobHash }).from(assets).where(eq(assets.blobHash, assetBlobs.hash)))
      )
    )
    .returning({ hash: assetBlobs.hash, storageProvider: assetBlobs.storageProvider, storageRef: assetBlobs.storageRef });

  for (const blob of deleted) {
    if (!blob.storageRef) continue;
    try {
      const storage = await getStorageProvider(blob.storageProvider);
      await storage?.delete(blob.storageRef);
    } catch (error) {
      console.warn(`Could not delete the stored object of blob "${blob.hash}". The object is now unused.`, error);
    }
  }
};
