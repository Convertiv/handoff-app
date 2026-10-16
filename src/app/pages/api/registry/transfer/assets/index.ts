import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAssetSummaryRoute } from '@/lib/registry-api/asset-transfer';

/**
 * `GET /api/registry/transfer/assets`: list asset collection summaries (collection + source hash)
 * for the CLI's skip-unchanged / bulk-checkout logic. Registry-runtime only (guard stack).
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleAssetSummaryRoute(req, res);
}
