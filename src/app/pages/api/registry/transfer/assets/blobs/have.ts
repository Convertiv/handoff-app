import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAssetBlobHaveRoute } from '@/lib/registry-api/asset-transfer';

/**
 * `POST /api/registry/transfer/assets/blobs/have`: given `{ hashes }`, return `{ missing }`, the
 * content hashes the registry does not yet have, so publish uploads only new blobs. Requires a
 * write-scoped credential; registry-runtime only.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleAssetBlobHaveRoute(req, res);
}
