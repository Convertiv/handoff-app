/**
 * Connected-workspace asset publish orchestration.
 *
 * `publish assets [collection]` runs a fresh build (`handoff.fetch()`), discovers the collections, and
 * uploads each changed one. A collection is skipped when its deterministic `sourceHash` is unchanged;
 * content transfers blob-by-blob (only hashes the registry lacks, since content-addressed dedup is the
 * per-blob skip-unchanged), and the manifest is finalized atomically only after its blobs exist.
 */

import Handoff from '../../index';
import type { AssetMetadata } from '../../store/types';
import { Logger } from '../../utils/logger';
import { ASSET_COLLECTIONS, isAssetCollection, type AssetCollection } from '../assets/sets';
import type { AssetCollectionSummary, AssetCollectionTransferPackage, AssetManifestEntry } from '../assets/transfer';
import { createRegistryClient } from '../client';
import { describePublishError } from './errors';
import { PublishError, resolveConnectionOrThrow } from './index';
import { createCurrentBuild, hashPathValues } from './publish-build';

/**
 * Deterministic collection hash over the path-sorted `(path, contentHash)` manifest. Order-
 * independent, so an unchanged collection hashes the same across rebuilds. Bytes aren't re-hashed
 * here; each asset already carries its blob hash.
 */
const hashCollection = (manifest: AssetMetadata[]): string => {
  return hashPathValues(manifest.map((asset) => ({ path: asset.path, value: asset.contentHash })));
};

const toManifestEntry = (asset: AssetMetadata): AssetManifestEntry => ({
  path: asset.path,
  name: asset.name,
  contentType: asset.contentType,
  size: asset.size,
  contentHash: asset.contentHash,
  metadata: asset.metadata ?? null,
});

/**
 * Publish all discovered asset collections, or a single collection when `collection` is given. Runs a
 * fresh build, skips collections whose content is unchanged on the registry, uploads only missing
 * blobs, and finalizes each manifest atomically. Reports published/unchanged/uploaded/failed counts;
 * throws at the end if any collection failed.
 */
export const publishAssets = async (handoff: Handoff, collection?: string): Promise<void> => {
  const connection = resolveConnectionOrThrow(handoff);
  if (collection && !isAssetCollection(collection)) {
    throw new PublishError(`Unknown asset collection "${collection}". Supported collections: ${ASSET_COLLECTIONS.join(', ')}.`);
  }

  Logger.info(collection ? `Building assets to publish "${collection}"…` : 'Building assets for publish…');
  await handoff.fetch();

  const available = await handoff.store.assets.listCollections();
  const targets: AssetCollection[] = collection && isAssetCollection(collection) ? [collection] : available.filter(isAssetCollection);

  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });
  let remote: AssetCollectionSummary[] = [];
  try {
    remote = await client.listAssetCollections();
  } catch {
    Logger.info('Could not read current registry asset collections; publishing all selected collections.');
  }
  const remoteHashByCollection = new Map(remote.map((entry) => [entry.collection, entry.sourceHash]));

  let published = 0;
  let unchanged = 0;
  let uploaded = 0;
  const failed: { collection: string; message: string }[] = [];

  for (const col of targets) {
    const manifest = await handoff.store.assets.listAssets(col);
    if (manifest.length === 0) {
      Logger.info(`Skipping empty collection: ${col}`);
      continue;
    }

    const sourceHash = hashCollection(manifest);
    if (remoteHashByCollection.get(col) === sourceHash) {
      unchanged += 1;
      Logger.info(`Unchanged: ${col}`);
      continue;
    }

    try {
      // Dedup by content hash: many paths may share bytes (identical icons, re-used archives).
      const byHash = new Map<string, AssetMetadata>();
      for (const asset of manifest) {
        if (!byHash.has(asset.contentHash)) byHash.set(asset.contentHash, asset);
      }
      const missing = await client.assetBlobHaveCheck(Array.from(byHash.keys()));
      for (const hash of missing) {
        const asset = byHash.get(hash);
        if (!asset) continue;
        const content = await handoff.store.assets.getAssetContent(col, asset.path);
        if (!content?.body) {
          throw new Error(`Could not read bytes for asset "${asset.path}" in collection "${col}".`);
        }
        await client.uploadAssetBlob(hash, content.contentType, content.body);
        uploaded += 1;
      }

      const pkg: AssetCollectionTransferPackage = {
        collection: col,
        build: createCurrentBuild({ sourceHash }),
        assets: manifest.map(toManifestEntry),
      };
      await client.publishAssetManifest(pkg);
      published += 1;
      Logger.info(`Published: ${col} (${manifest.length} asset(s), ${missing.length} new blob(s))`);
    } catch (error) {
      failed.push({
        collection: col,
        message: describePublishError(error, connection.url, 'asset collection'),
      });
    }
  }

  Logger.success(
    `Assets publish complete: ${published} published, ${unchanged} unchanged, ${uploaded} blob(s) uploaded${
      failed.length ? `, ${failed.length} failed` : ''
    }.`
  );
  if (failed.length > 0) {
    for (const failure of failed) {
      Logger.error(`  - ${failure.collection}: ${failure.message}`);
    }
    throw new PublishError(`${failed.length} asset collection(s) failed to publish.`);
  }
};
