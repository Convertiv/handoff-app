import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Method guard shared by every API route. It carries no registry dependency, so routes that also
 * serve workspace mode can use it without pulling the registry auth/database layer into that path.
 */
export const allowApiMethods = (req: NextApiRequest, res: NextApiResponse, methods: string[]): string | null => {
  const method = (req.method ?? 'GET').toUpperCase();
  if (methods.includes(method)) return method;
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ error: `Method ${method} is not allowed.` });
  return null;
};
