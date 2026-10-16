import type { NextApiRequest, NextApiResponse } from 'next';
import { handleTokenSummaryRoute } from '@/lib/registry-api/token-transfer';

/**
 * `GET /api/registry/transfer/tokens` — list the registry's token-set summaries (id + kind + source
 * hash + status) so a connected workspace can skip unchanged sets and enumerate sets for bulk
 * checkout. Registry-runtime only (enforced by the guard stack).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleTokenSummaryRoute(req, res);
}
