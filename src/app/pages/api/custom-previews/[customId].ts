import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '@/lib/api/query';
import { resolveDocsBackend } from '@/lib/docs-api';
import { allowApiMethods, prepareRegistryApi } from '@/lib/auth/api';
import { sendCustomPreviewError } from '@/lib/custom-previews/http';
import { deleteCustomPreview, updateCustomPreview } from '@/lib/custom-previews/service';

/** PATCH replaces args whole. Only the author or an administrator may change or delete a preview. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = allowApiMethods(req, res, ['PATCH', 'DELETE']);
  if (!method) return;
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: true });
  if (!context?.user) return;

  const id = singleQueryValue(req.query.customId) ?? '';
  const actor = { userId: context.user.id, role: context.user.role };
  try {
    const backend = await resolveDocsBackend();
    if (method === 'DELETE') {
      await deleteCustomPreview(context.db, backend, actor, id);
      res.status(204).end();
      return;
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const customPreview = await updateCustomPreview(context.db, backend, actor, id, {
      title: body.title,
      description: body.description,
      args: body.args,
    });
    res.status(200).json({ customPreview });
  } catch (error) {
    sendCustomPreviewError(res, error);
  }
}
