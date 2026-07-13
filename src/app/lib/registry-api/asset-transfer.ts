import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { eq, inArray } from 'drizzle-orm';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { assetBlobs, assetCollections, assets } from '@handoff/registry/db/schema';
import { isAssetCollection, type AssetCollection } from '@handoff/registry/assets/sets';
import type { AssetCollectionTransferPackage, AssetManifestEntry } from '@handoff/registry/assets/transfer';
import { singleQueryValue } from '../api/query';
import { getActiveAssetStorage, getActiveAssetStorageAdapter, getAssetStorageAdapter } from '../asset-storage';
import { sendRegistryError } from './errors';
import { buildMeta } from './meta';
import { handleRegistryRoute, sendRegistryData } from './handler';
import {
  asString,
  invalidPackage as invalid,
  isPlainObject,
  isSha256Hash,
  normalizeSafeRelativePath,
  type PackageValidation,
  validateTransferBuild,
} from './validation';

/**
 * Asset transfer ingestion + serving for the registry.
 *
 * - `GET  /api/registry/transfer/assets` lists collection summaries (collection + source hash).
 * - `GET  /api/registry/transfer/assets/:collection` is checkout: the collection manifest metadata.
 * - `PUT  /api/registry/transfer/assets/:collection` is publish ingestion: validates the manifest,
 *   asserts every referenced blob already exists (so a manifest never references missing content),
 *   then atomically upserts the `asset_collections` row and replaces its `assets` rows in one
 *   transaction. An unchanged collection (matching `sourceHash`) is a no-op.
 * - `POST /api/registry/transfer/assets/blobs/have` returns which content hashes are missing.
 * - `PUT  /api/registry/transfer/assets/blobs/:hash` stores one content-addressed blob (binary body)
 *   through the active storage provider (inline `bytea` by default). Idempotent by hash.
 * - `GET  /api/registry/transfer/assets/blobs/:hash` returns/redirects to one blob's bytes.
 *
 * Runs behind {@link handleRegistryRoute}: runtime-mode, method, bearer-token (on mutations), and
 * database guards apply before any of this executes.
 */

/** Validate an asset collection publish package (manifest metadata only; bodies travel as blobs). */
const validateAssetPackage = (body: unknown, collection: string): PackageValidation<AssetCollectionTransferPackage> => {
  if (!isPlainObject(body)) {
    return invalid('Request body must be a JSON object.');
  }
  if (!isAssetCollection(collection)) {
    return invalid(`Unknown asset collection "${collection}".`, { rejectedFields: ['collection'] });
  }
  const bodyCollection = asString(body.collection);
  if (bodyCollection !== undefined && bodyCollection !== collection) {
    return invalid(`Package collection "${bodyCollection}" does not match the publish target "${collection}".`, {
      rejectedFields: ['collection'],
    });
  }

  const rawAssets = body.assets ?? [];
  if (!Array.isArray(rawAssets)) {
    return invalid('`assets` must be an array.', { rejectedFields: ['assets'] });
  }
  const manifest: AssetManifestEntry[] = [];
  const seenPaths = new Set<string>();
  for (let i = 0; i < rawAssets.length; i += 1) {
    const raw = rawAssets[i];
    const field = (name: string) => `assets[${i}].${name}`;
    if (!isPlainObject(raw)) {
      return invalid('Each asset must be an object.', { rejectedFields: [`assets[${i}]`] });
    }
    const assetPath = normalizeSafeRelativePath(raw.path);
    if (!assetPath) {
      return invalid('Asset path must be a registry-safe relative path.', { rejectedFields: [field('path')] });
    }
    if (seenPaths.has(assetPath)) {
      return invalid(`Duplicate asset path "${assetPath}" in manifest.`, { rejectedFields: [field('path')] });
    }
    seenPaths.add(assetPath);
    const contentHash = asString(raw.contentHash);
    if (!isSha256Hash(contentHash)) {
      return invalid(`Asset "${assetPath}" is missing a valid SHA-256 contentHash.`, { rejectedFields: [field('contentHash')] });
    }
    manifest.push({
      path: assetPath,
      name: asString(raw.name) || assetPath,
      contentType: asString(raw.contentType) || 'application/octet-stream',
      size: typeof raw.size === 'number' ? raw.size : 0,
      contentHash: contentHash.toLowerCase(),
      metadata: isPlainObject(raw.metadata) ? (raw.metadata as Record<string, unknown>) : null,
    });
  }

  const buildValidation = validateTransferBuild(body.build, {
    requiredHashField: 'sourceHash',
    currentMessage: 'A "current" asset build requires builtAt, builderVersion, and sourceHash.',
  });
  if (!buildValidation.ok) {
    return invalid(buildValidation.message, buildValidation.details);
  }
  const build = buildValidation.value;

  return {
    ok: true,
    value: {
      collection: collection as AssetCollection,
      assets: manifest,
      build: {
        status: build.status,
        builtAt: build.builtAt,
        builderVersion: build.builderVersion,
        sourceHash: build.sourceHash,
      },
    },
  };
};

/** The stored source hash for a collection, or `undefined` when it does not exist yet. */
const storedSourceHash = async (db: RegistryDatabase, collection: string): Promise<string | null | undefined> => {
  const rows = await db
    .select({ sourceHash: assetCollections.sourceHash })
    .from(assetCollections)
    .where(eq(assetCollections.collection, collection as AssetCollection))
    .limit(1);
  return rows.length ? rows[0].sourceHash : undefined;
};

/** Atomically upsert the collection row and replace its manifest rows in one transaction. */
const ingestAssetCollection = async (db: RegistryDatabase, pkg: AssetCollectionTransferPackage): Promise<void> => {
  const collectionValues = {
    sourceHash: pkg.build.sourceHash ?? null,
    status: pkg.build.status,
    builtAt: pkg.build.builtAt ? new Date(pkg.build.builtAt) : null,
    builderVersion: pkg.build.builderVersion ?? null,
    updatedAt: new Date(),
  };

  await db.transaction(async (tx) => {
    await tx
      .insert(assetCollections)
      .values({ collection: pkg.collection, metadata: null, ...collectionValues } as any)
      .onConflictDoUpdate({ target: assetCollections.collection, set: collectionValues as any });

    await tx.delete(assets).where(eq(assets.collection, pkg.collection));
    for (const asset of pkg.assets) {
      await tx.insert(assets).values({
        collection: pkg.collection,
        path: asset.path,
        name: asset.name,
        contentType: asset.contentType,
        size: asset.size,
        contentHash: asset.contentHash,
        metadata: asset.metadata ?? null,
        blobHash: asset.contentHash,
      } as any);
    }
  });
};

/** Read the raw binary request body (blob upload routes disable the JSON body parser). */
const readRawBody = (req: NextApiRequest): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

/** `GET /api/registry/transfer/assets`: list collection summaries. */
export const handleAssetSummaryRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['GET'], async ({ db }) => {
    const rows = await db
      .select({ collection: assetCollections.collection, sourceHash: assetCollections.sourceHash, status: assetCollections.status })
      .from(assetCollections);
    sendRegistryData(res, 200, { collections: rows }, buildMeta());
  });

/** `GET|PUT /api/registry/transfer/assets/:collection`: checkout / publish one collection manifest. */
export const handleAssetCollectionRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['GET', 'PUT'], async ({ db, method }) => {
    const collection = singleQueryValue(req.query.collection) ?? '';
    if (!collection) {
      sendRegistryError(res, 'not_found', 'Missing asset collection.');
      return;
    }

    if (method === 'GET') {
      const found = await db
        .select({ collection: assetCollections.collection })
        .from(assetCollections)
        .where(eq(assetCollections.collection, collection as AssetCollection))
        .limit(1);
      if (!found.length) {
        sendRegistryError(res, 'not_found', `No asset collection "${collection}" exists in the registry.`);
        return;
      }
      const rows = await db
        .select({
          path: assets.path,
          name: assets.name,
          contentType: assets.contentType,
          size: assets.size,
          contentHash: assets.contentHash,
          metadata: assets.metadata,
        })
        .from(assets)
        .where(eq(assets.collection, collection as AssetCollection));
      sendRegistryData(res, 200, { collection, assets: rows }, buildMeta());
      return;
    }

    // PUT: publish ingestion.
    const validation = validateAssetPackage(req.body, collection);
    if (!validation.ok) {
      sendRegistryError(res, 'bad_request', validation.message ?? 'Invalid asset collection package.', validation.details);
      return;
    }
    const pkg = validation.value;

    const existingHash = await storedSourceHash(db, collection);
    if (existingHash && pkg.build.sourceHash && existingHash === pkg.build.sourceHash) {
      sendRegistryData(res, 200, { collection, published: false, unchanged: true }, buildMeta());
      return;
    }

    // Guard: never finalize a manifest that references a blob the registry does not have.
    const referenced = Array.from(new Set(pkg.assets.map((asset) => asset.contentHash)));
    if (referenced.length > 0) {
      const present = await db.select({ hash: assetBlobs.hash }).from(assetBlobs).where(inArray(assetBlobs.hash, referenced));
      const presentSet = new Set(present.map((row) => row.hash));
      const missing = referenced.filter((hash) => !presentSet.has(hash));
      if (missing.length > 0) {
        sendRegistryError(
          res,
          'bad_request',
          `Cannot finalize collection "${collection}": ${missing.length} referenced blob(s) were not uploaded.`,
          {
            rejectedFields: ['assets'],
            missing,
          }
        );
        return;
      }
    }

    await ingestAssetCollection(db, pkg);
    sendRegistryData(res, 200, { collection, published: true, assets: pkg.assets.length }, buildMeta());
  });

/** `POST /api/registry/transfer/assets/blobs/have`: return which of the given hashes are missing. */
export const handleAssetBlobHaveRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['POST'], async ({ db }) => {
    const body = req.body;
    const hashes = isPlainObject(body) && Array.isArray(body.hashes) ? body.hashes.filter((h): h is string => typeof h === 'string') : [];
    if (hashes.length === 0) {
      sendRegistryData(res, 200, { missing: [] }, buildMeta());
      return;
    }
    const present = await db.select({ hash: assetBlobs.hash }).from(assetBlobs).where(inArray(assetBlobs.hash, hashes));
    const presentSet = new Set(present.map((row) => row.hash));
    sendRegistryData(res, 200, { missing: hashes.filter((hash) => !presentSet.has(hash)) }, buildMeta());
  });

/** `PUT|GET /api/registry/transfer/assets/blobs/:hash`: store / fetch one content-addressed blob. */
export const handleAssetBlobRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['GET', 'PUT'], async ({ db, method }) => {
    const hash = (singleQueryValue(req.query.hash) ?? '').toLowerCase();
    if (!isSha256Hash(hash)) {
      sendRegistryError(res, 'bad_request', 'Blob hash must be a SHA-256 hex string.');
      return;
    }

    if (method === 'PUT') {
      const bytes = await readRawBody(req);
      const actual = crypto.createHash('sha256').update(bytes).digest('hex');
      if (actual !== hash) {
        sendRegistryError(res, 'bad_request', `Uploaded content hash "${actual}" does not match the target "${hash}".`, {
          rejectedFields: ['hash'],
        });
        return;
      }
      const existing = await db.select({ hash: assetBlobs.hash }).from(assetBlobs).where(eq(assetBlobs.hash, hash)).limit(1);
      if (existing.length > 0) {
        sendRegistryData(res, 200, { hash, stored: true }, buildMeta());
        return;
      }
      const contentType =
        (Array.isArray(req.headers['content-type']) ? req.headers['content-type'][0] : req.headers['content-type']) ||
        'application/octet-stream';
      const active = getActiveAssetStorage();

      let storageProvider = active.provider;
      let content: Buffer | null = null;
      let storageRef: string | null = null;
      if (active.provider === 'database') {
        if (bytes.length > active.maxInlineBytes) {
          sendRegistryError(
            res,
            'bad_request',
            `Blob is ${bytes.length} bytes, above the database inline limit of ${active.maxInlineBytes}. Configure object storage (runtime.registry.assetStorage) for large assets.`
          );
          return;
        }
        content = bytes;
      } else {
        const adapter = await getActiveAssetStorageAdapter();
        if (!adapter) {
          sendRegistryError(res, 'unexpected_error', `No storage adapter is available for provider "${active.provider}".`);
          return;
        }
        ({ storageRef } = await adapter.put({ hash, bytes, contentType, size: bytes.length }));
        storageProvider = active.provider;
      }

      await db
        .insert(assetBlobs)
        .values({ hash, storageProvider, content, storageRef, contentType, size: bytes.length } as any)
        .onConflictDoNothing({ target: assetBlobs.hash });
      sendRegistryData(res, 200, { hash, stored: true }, buildMeta());
      return;
    }

    // GET: resolve and serve the blob bytes (redirecting to object storage where possible).
    const rows = await db
      .select({
        content: assetBlobs.content,
        storageRef: assetBlobs.storageRef,
        storageProvider: assetBlobs.storageProvider,
        contentType: assetBlobs.contentType,
      })
      .from(assetBlobs)
      .where(eq(assetBlobs.hash, hash))
      .limit(1);
    const blob = rows[0];
    if (!blob) {
      sendRegistryError(res, 'not_found', `No blob "${hash}" exists in the registry.`);
      return;
    }

    res.setHeader('ETag', `"${hash}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (blob.content != null) {
      res.setHeader('Content-Type', blob.contentType);
      res.status(200).send(Buffer.from(blob.content));
      return;
    }
    if (!blob.storageRef) {
      sendRegistryError(res, 'not_found', `Blob "${hash}" has no resolvable content.`);
      return;
    }
    const adapter = await getAssetStorageAdapter(blob.storageProvider);
    if (!adapter) {
      sendRegistryError(res, 'unexpected_error', `No storage adapter is available for provider "${blob.storageProvider}".`);
      return;
    }
    const result = await adapter.get(blob.storageRef);
    if (result.kind === 'redirect') {
      res.redirect(302, result.url);
      return;
    }
    res.setHeader('Content-Type', result.contentType || blob.contentType);
    if (result.kind === 'bytes') {
      res.status(200).send(result.bytes);
      return;
    }
    result.stream.pipe(res);
  });
