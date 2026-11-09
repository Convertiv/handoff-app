import type { NextApiRequest, NextApiResponse } from 'next';
import { sendDocsError } from '../docs-api';
import { handleDocsRoute } from '../docs-api/handler';
import type { DocsBackend } from '../docs-api/backend';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { getRegistryConnection } from '../registry-connection';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { CustomPreviewError } from './service';

const STATUS_BY_CODE = { not_found: 404, forbidden: 403, invalid: 400 } as const;

export const sendCustomPreviewError = (res: NextApiResponse, error: unknown): void => {
  if (error instanceof CustomPreviewError) {
    res.status(STATUS_BY_CODE[error.code]).json({ error: error.message, code: error.code });
    return;
  }
  throw error;
};

export const handleCustomPreviewReadRoute = (
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (db: RegistryDatabase, backend: DocsBackend) => Promise<void>
): Promise<void> =>
  handleDocsRoute(req, res, async (backend) => {
    if (getServerRuntimeConfig().mode !== 'registry') {
      sendDocsError(res, 'not_found', 'Custom previews are available only in registry mode.');
      return;
    }
    const { db } = await getRegistryConnection();
    try {
      await handler(db, backend);
    } catch (error) {
      if (error instanceof CustomPreviewError) {
        sendDocsError(res, error.code === 'invalid' ? 'invalid_request' : 'not_found', error.message);
        return;
      }
      throw error;
    }
  });
