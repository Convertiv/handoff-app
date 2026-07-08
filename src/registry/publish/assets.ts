/**
 * Connected-workspace asset publish orchestration.
 *
 * `publish assets [collection]` runs a fresh build (`handoff.fetch()`), discovers the collections, and
 * uploads each changed one. A collection is skipped when its deterministic `sourceHash` is unchanged;
 * content transfers blob-by-blob (only hashes the registry lacks, since content-addressed dedup is the
 * per-blob skip-unchanged), and the manifest is finalized atomically only after its blobs exist.
 */

import crypto from 'crypto';
import Handoff from '../../index';
import { Logger } from '../../utils/logger';
import { ASSET_COLLECTIONS, isAssetCollection, type AssetCollection } from '../assets/sets';
import type { AssetCollectionSummary, AssetCollectionTransferPackage, AssetManifestEntry } from '../assets/transfer';
import { createRegistryClient, RegistryClientError } from '../client';
import type { AssetMetadata } from '../../store/types';
import { PublishError, resolveConnectionOrThrow } from './index';
import { getBuilderVersion } from './package';

/**
 * Deterministic collection hash over the path-sorted `(path, contentHash)` manifest. Order-
 * independent, so an unchanged collection hashes the same across rebuilds. Bytes aren't re-hashed
 * here; each asset already carries its blob hash.
 */
const hashCollection = (manifest: AssetMetadata[]): string => {
  const hash = crypto.createHash('sha256');
  for (const asset of [...manifest].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(asset.path);
    hash.update('\0');
    hash.update(asset.contentHash);
    hash.update('\0');
  }
  return hash.digest('hex');
};

/** Map a registry client error to an actionable publish message. */
const describeUploadFailure = (error: RegistryClientError, registryUrl: string): string => {
  switch (error.code) {
    case 'runtime_mode_conflict':
      return `The registry at ${registryUrl} is not running in registry mode, so it cannot accept publishes: ${error.message}`;
    case 'token_not_configured':
      return `The registry at ${registryUrl} has no management token configured, so it is rejecting mutations: ${error.message}`;
    case 'unauthorized':
      return `The registry rejected the access token (401). Check the configured access token matches the registry's token.`;
    case 'bad_request':
      return `The registry rejected the asset collection (400): ${error.message}`;
    default:
      return error.message;
  }
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
  const targets: AssetCollection[] = (collection ? [collection as AssetCollection] : (available as AssetCollection[])).filter(isAssetCollection);

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
        build: {
          status: 'current',
          builtAt: new Date().toISOString(),
          builderVersion: getBuilderVersion(),
          sourceHash,
        },
        assets: manifest.map(toManifestEntry),
      };
      await client.publishAssetManifest(pkg);
      published += 1;
      Logger.info(`Published: ${col} (${manifest.length} asset(s), ${missing.length} new blob(s))`);
    } catch (error) {
      const message =
        error instanceof RegistryClientError
          ? describeUploadFailure(error, connection.url)
          : error instanceof Error
            ? error.message
            : String(error);
      failed.push({ collection: col, message });
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
