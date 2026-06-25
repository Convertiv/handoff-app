import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureRegistryMode, sendRegistryError } from '@/lib/registry-api';

/**
 * `GET /api/registry/health` — registry liveness. Registry-runtime only
 * (`409 runtime_mode_conflict` in workspace mode); unauthenticated, like all registry GET reads. It
 * reports the runtime/source without touching the database so it can be used as a cheap probe, and
 * returns the documented bare `{ ok, runtime, source }` body rather than the data envelope.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (!ensureRegistryMode(req, res)) {
    return;
  }
  if ((req.method ?? 'GET').toUpperCase() !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendRegistryError(res, 'method_not_allowed', `Method ${req.method ?? 'unknown'} not allowed; health is GET-only.`);
    return;
  }
  res.status(200).json({ ok: true, runtime: 'registry', source: 'database' });
}
