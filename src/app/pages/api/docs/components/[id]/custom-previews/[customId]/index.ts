import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { sendDocsData, sendDocsError } from '@/lib/docs-api';
import { handleCustomPreviewReadRoute } from '@/lib/custom-previews/http';
import { argsSchemaFor, getCustomPreview } from '@/lib/custom-previews/service';

export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleCustomPreviewReadRoute(req, res, async (db, backend) => {
    const id = singleQueryValue(req.query.id) ?? '';
    const customId = singleQueryValue(req.query.customId) ?? '';
    const { preview, component } = await getCustomPreview(db, backend, customId);
    if (preview.componentId !== id) {
      sendDocsError(res, 'not_found', `Component "${id}" has no custom preview "${customId}".`);
      return;
    }
    sendDocsData(res, 200, { customPreview: preview, argsSchema: argsSchemaFor(component) });
  });
}
