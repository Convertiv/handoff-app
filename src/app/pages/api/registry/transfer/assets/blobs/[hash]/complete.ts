import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAssetBlobCompleteRoute } from '@/lib/registry-api/asset-transfer';

/**
 * `POST /api/registry/transfer/assets/blobs/:hash/complete`: given `{ storageRef, size, contentType }`
 * from a direct upload, confirm the object exists in storage and record the blob. Requires a
 * write-scoped credential; registry-runtime only.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleAssetBlobCompleteRoute(req, res);
}
