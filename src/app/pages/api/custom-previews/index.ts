import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveDocsBackend } from '@/lib/docs-api';
import { allowApiMethods, prepareRegistryApi } from '@/lib/auth/api';
import { sendCustomPreviewError } from '@/lib/custom-previews/http';
import { createCustomPreview } from '@/lib/custom-previews/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!allowApiMethods(req, res, ['POST'])) return;
  const context = await prepareRegistryApi(req, res, { auth: 'user', mutation: true });
  if (!context?.user) return;

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  try {
    const customPreview = await createCustomPreview(
      context.db,
      await resolveDocsBackend(),
      { userId: context.user.id, role: context.user.role },
      { componentId: body.componentId, title: body.title, description: body.description, args: body.args }
    );
    res.status(201).json({ customPreview });
  } catch (error) {
    sendCustomPreviewError(res, error);
  }
}
