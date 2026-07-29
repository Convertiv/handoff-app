import type { NextApiRequest, NextApiResponse } from 'next';
import { handleTokenCheckoutRoute, handleTokenTransferRoute } from '@/lib/registry-api/token-transfer';

/**
 * `/api/registry/transfer/tokens/:setId` — the token-set transfer endpoint. The catch-all param
 * carries the multi-segment logical set id (`foundation/colors`, `component/button`).
 *
 * - `GET` is checkout: the set record + its generated artifacts. Requires a `registry:read` token.
 * - `PUT` is publish ingestion: validates the package and atomically upserts the set + its artifacts.
 *   Requires a `registry:write` token.
 *
 * Both are registry-runtime only (enforced by the guard stack).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const method = (req.method ?? 'GET').toUpperCase();
  return method === 'GET' ? handleTokenCheckoutRoute(req, res) : handleTokenTransferRoute(req, res);
}

/** Token packages carry generated artifact content, so accept up to Vercel's 4.5 MB function body limit. */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};
