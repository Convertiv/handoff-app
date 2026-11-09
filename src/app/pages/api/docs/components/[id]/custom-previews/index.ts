import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { sendDocsData } from '@/lib/docs-api';
import { handleCustomPreviewReadRoute } from '@/lib/custom-previews/http';
import { listCustomPreviews } from '@/lib/custom-previews/service';

export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleCustomPreviewReadRoute(req, res, async (db, backend) => {
    const id = singleQueryValue(req.query.id) ?? '';
    sendDocsData(res, 200, { customPreviews: await listCustomPreviews(db, backend, id) });
  });
}
