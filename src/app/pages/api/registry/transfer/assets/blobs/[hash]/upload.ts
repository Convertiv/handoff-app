import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAssetBlobUploadRoute } from '@/lib/registry-api/asset-transfer';

/**
 * `POST /api/registry/transfer/assets/blobs/:hash/upload`: given `{ size, contentType }`, return
 * `{ upload }`, a signed URL to upload the blob directly to storage, or `null` when the client must
 * upload through `PUT /api/registry/transfer/assets/blobs/:hash`. Requires a write-scoped
 * credential; registry-runtime only.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleAssetBlobUploadRoute(req, res);
}
