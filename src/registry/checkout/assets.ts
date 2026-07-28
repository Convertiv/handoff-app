/**
 * Connected-workspace asset checkout orchestration.
 *
 * `checkout assets [collection]` pulls published asset collections from the connected registry into
 * this workspace: it recreates the standard workspace asset files (per-asset icon/logo bodies, the
 * collection JSON, the icon sprite + manifest, and the downloadable ZIP/font archives) at their
 * canonical locations. Content-addressed blobs are downloaded once per hash. Overwriting changed
 * local files requires `--force` or an interactive confirmation. Available only from a connected
 * workspace.
 */

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../index';
import { Logger } from '../../utils/logger';
import { resolveAssetPhysicalPath, type AssetPhysicalRoots } from '../assets/layout';
import { ASSET_COLLECTIONS, isAssetCollection, type AssetCollection } from '../assets/sets';
import type { AssetCollectionCheckoutPayload } from '../assets/transfer';
import { createRegistryClient, RegistryClientError } from '../client';
import { CheckoutError, resolveConnectionOrThrow } from './index';

/** Map a registry client error to an actionable checkout message. */
const describeFetchFailure = (error: RegistryClientError, target: string, registryUrl: string): string => {
  switch (error.code) {
    case 'not_found':
      return `No asset collection "${target}" exists in the registry at ${registryUrl}.`;
    case 'runtime_mode_conflict':
      return `The registry at ${registryUrl} is not running in registry mode, so it cannot serve a checkout: ${error.message}`;
    case 'unauthorized':
      return `The registry rejected the access token (401). Run \`handoff-app login --url ${registryUrl}\` again, or replace the user-issued CI token.`;
    case 'forbidden':
      return `The registry token does not have permission to checkout assets (403). Authorize a token with registry:read access.`;
    default:
      return error.message;
  }
};

/** One resolved file to write: its absolute local path and bytes. */
interface AssetWrite {
  absolutePath: string;
  bytes: Buffer;
}

/** Whether writing `bytes` to `absolutePath` would change (or create) the file. */
const wouldChange = (absolutePath: string, bytes: Buffer): boolean => {
  try {
    if (!fs.existsSync(absolutePath)) return true;
    return !fs.readFileSync(absolutePath).equals(bytes);
  } catch {
    return true;
  }
};

/**
 * Checkout all published asset collections, or a single collection when `collection` is given.
 * Recreates workspace asset files; prompts before overwriting changed local files unless `--force`.
 */
export const checkoutAssets = async (handoff: Handoff, collection?: string): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);
  if (collection && !isAssetCollection(collection)) {
    throw new CheckoutError(`Unknown asset collection "${collection}". Supported collections: ${ASSET_COLLECTIONS.join(', ')}.`);
  }
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });

  let collections: AssetCollection[];
  if (collection) {
    collections = [collection as AssetCollection];
  } else {
    const summaries = await client.listAssetCollections();
    collections = summaries.map((summary) => summary.collection).filter(isAssetCollection);
    if (collections.length === 0) {
      Logger.info('No asset collections are published to the registry; nothing to checkout.');
      return;
    }
  }

  const payloads: AssetCollectionCheckoutPayload[] = [];
  for (const col of collections) {
    try {
      payloads.push(await client.checkoutAssetCollection(col));
    } catch (error) {
      if (error instanceof RegistryClientError) {
        throw new CheckoutError(describeFetchFailure(error, col, connection.url));
      }
      throw error;
    }
  }

  const roots: AssetPhysicalRoots = {
    apiPath: handoff.getAssetsApiPath(),
    iconsZip: handoff.getIconsZipFilePath(),
    logosZip: handoff.getLogosZipFilePath(),
    workingPath: handoff.workingPath,
  };

  // Download each referenced blob once (dedup by hash), then resolve every asset to a physical write.
  const blobCache = new Map<string, Buffer>();
  const writes: AssetWrite[] = [];
  for (const payload of payloads) {
    for (const asset of payload.assets) {
      let bytes = blobCache.get(asset.contentHash);
      if (!bytes) {
        bytes = await client.downloadAssetBlob(asset.contentHash);
        blobCache.set(asset.contentHash, bytes);
      }
      writes.push({ absolutePath: resolveAssetPhysicalPath(asset.path, roots), bytes });
    }
  }

  const existingChanges = writes.filter((write) => fs.existsSync(write.absolutePath) && wouldChange(write.absolutePath, write.bytes));
  if (existingChanges.length > 0 && !handoff.force) {
    const proceed = await p.confirm({
      message: `Checkout will overwrite ${existingChanges.length} changed local asset file(s). Continue?`,
    });
    if (p.isCancel(proceed) || proceed !== true) {
      Logger.info('Asset checkout cancelled; no files were written.');
      return;
    }
  }

  for (const write of writes) {
    await fs.ensureDir(path.dirname(write.absolutePath));
    await fs.writeFile(write.absolutePath, write.bytes);
  }

  Logger.success(`Checked out ${collections.length} asset collection(s) (${writes.length} file(s) restored).`);
};
