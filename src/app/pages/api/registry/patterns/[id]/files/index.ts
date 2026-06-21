import type { NextApiRequest, NextApiResponse } from 'next';
import { handleEntityFilesCollection } from '@/lib/registry-api/entity-routes';

/**
 * `GET /api/registry/patterns/{id}/files` (list) and `POST` (create/replace a text-file record).
 * Declaration files and unsafe paths are rejected with `400 bad_request`; POST requires the token.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleEntityFilesCollection(req, res, 'pattern');
}
