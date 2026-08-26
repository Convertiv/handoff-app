import type { NextApiRequest, NextApiResponse } from 'next';
import { handleSyncUploadRoute } from '@/lib/registry-api/sync-compat';

/**
 * Deprecated `POST /api/sync/upload`. Kept for clients following the published sync API; it
 * translates the documented batch onto the same ingestion the canonical `/api/registry/transfer/*`
 * routes use. See `lib/registry-api/sync-compat` for the contract and its limits.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleSyncUploadRoute(req, res);
}

// Matches the transfer routes: a publish package carries inline file and artifact content, and the
// body config is per route rather than inherited.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
