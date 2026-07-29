import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAssetBlobRoute } from '@/lib/registry-api/asset-transfer';

/**
 * `/api/registry/transfer/assets/blobs/:hash`: one content-addressed blob.
 *
 * - `PUT` stores the raw binary body through the active storage provider (inline `bytea` by default,
 *   or an object-storage adapter). Idempotent by hash; requires a `registry:write` token.
 * - `GET` returns the blob's bytes, or redirects to a provider URL for object-backed content.
 *   Requires a `registry:read` token.
 *
 * Registry-runtime only (guard stack).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleAssetBlobRoute(req, res);
}

/** Blobs are binary, so the JSON body parser is disabled and the raw bytes reach the handler intact. */
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};
