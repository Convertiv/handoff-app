/**
 * Pre-packaged Vercel Blob asset storage adapter.
 *
 * Ships with Handoff and is selected via `runtime.registry.assetStorage.adapter: "vercel-blob"`. The
 * read/write token is read from `process.env[tokenEnv]` at request time (never persisted in config).
 * Blobs are stored public and content-addressed by hash, so reads resolve to a direct provider URL
 * (a `redirect` result), keeping large payloads out of the serverless function body/response.
 *
 * The `@vercel/blob` SDK is loaded lazily so it is only pulled into memory (and traced into the
 * registry bundle) when this adapter is actually used.
 */

import type { AssetStorage } from '../types';

/** Build a Vercel Blob storage adapter bound to a token env-var name + non-secret options. */
export const createVercelBlobStorage = (params: { tokenEnv: string; options: Record<string, unknown> }): AssetStorage => {
  const prefix = typeof params.options.prefix === 'string' && params.options.prefix.trim() ? params.options.prefix.trim() : 'handoff/assets';

  const resolveToken = (): string => {
    const token = process.env[params.tokenEnv]?.trim();
    if (!token) {
      throw new Error(
        `Vercel Blob storage is configured but the token env var "${params.tokenEnv}" is not set. ` +
          'Set it to a Blob read/write token, or change runtime.registry.assetStorage.tokenEnv.'
      );
    }
    return token;
  };

  return {
    async put({ hash, bytes, contentType }) {
      const { put } = await import('@vercel/blob');
      // Content-addressed pathname + no random suffix so the same bytes map to a stable, dedupable key.
      const result = await put(`${prefix}/${hash}`, bytes, {
        access: 'public',
        token: resolveToken(),
        contentType,
        addRandomSuffix: false,
      });
      return { storageRef: result.url };
    },
    async get(storageRef) {
      // Public blob URLs are directly fetchable; redirect the client to avoid proxying bytes.
      return { kind: 'redirect', url: storageRef };
    },
    async delete(storageRef) {
      const { del } = await import('@vercel/blob');
      await del(storageRef, { token: resolveToken() });
    },
  };
};
