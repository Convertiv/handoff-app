import type { NextApiRequest, NextApiResponse } from 'next';
import { handleCollectionRoute } from '@/lib/screens/http';

/** A screen collection: `GET` lists or reads, `POST` creates, `PUT` writes, `DELETE` removes. See `lib/screens/http.ts`. */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleCollectionRoute(req, res);
}
