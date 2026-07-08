import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAssetCollectionRoute } from '@/lib/registry-api/asset-transfer';

/**
 * `/api/registry/transfer/assets/:collection`: the asset collection manifest endpoint.
 *
 * - `GET` is checkout: the collection's manifest metadata (bodies travel separately as blobs).
 * - `PUT` is publish ingestion: validates the manifest, asserts referenced blobs exist, and
 *   atomically replaces the collection's manifest. Requires the bearer token.
 *
 * Both are registry-runtime only (enforced by the guard stack).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleAssetCollectionRoute(req, res);
}

/** Manifests are metadata-only but can be large for big collections, so allow up to the 4.5 MB limit. */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
