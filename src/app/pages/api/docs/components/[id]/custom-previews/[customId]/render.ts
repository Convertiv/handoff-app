import type { NextApiRequest, NextApiResponse } from 'next';
import { CUSTOM_PREVIEW_CONTENT_SECURITY_POLICY } from '@handoff/custom-previews';
import { singleQueryValue } from '@/lib/api/query';
import { sendDocsError } from '@/lib/docs-api';
import { handleCustomPreviewReadRoute } from '@/lib/custom-previews/http';
import { renderCustomPreviewDocument } from '@/lib/custom-previews/service';

export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleCustomPreviewReadRoute(req, res, async (db, backend) => {
    const id = singleQueryValue(req.query.id) ?? '';
    const customId = singleQueryValue(req.query.customId) ?? '';
    const result = await renderCustomPreviewDocument(db, backend, customId, id);
    if ('missing' in result) {
      if (result.missing === 'shell') {
        sendDocsError(res, 'artifact_not_found', `Component "${id}" was published without a render shell. Republish it.`);
      } else {
        sendDocsError(res, 'not_found', `Component "${id}" has no custom preview "${customId}".`);
      }
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    // Any member can write args that run script, so even a direct navigation runs sandboxed.
    res.setHeader('Content-Security-Policy', CUSTOM_PREVIEW_CONTENT_SECURITY_POLICY);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(result.html);
  });
}
