import type { NextApiRequest } from 'next';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import {
  authenticateRegistryAccessToken,
  registryPrincipalHasScope,
  type RegistryAccessScope,
  type RegistryPrincipal,
} from '@handoff/registry/auth';

export interface RegistryAuthResult {
  ok: boolean;
  code?: 'unauthorized' | 'forbidden';
  message?: string;
  principal?: RegistryPrincipal;
}

const bearerToken = (req: NextApiRequest): string => {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : '';
};

/**
 * Authorize a registry request with a live, revocable user token carrying the required scope: reads
 * need `registry:read`, mutations need `registry:write`. Every `/api/registry/*` request runs
 * through this — there are no public endpoints behind the guard stack.
 */
export const authorizeRegistryRequest = async (
  req: NextApiRequest,
  db: RegistryDatabase,
  scope: RegistryAccessScope
): Promise<RegistryAuthResult> => {
  const principal = await authenticateRegistryAccessToken(db, bearerToken(req));
  if (!principal) {
    return {
      ok: false,
      code: 'unauthorized',
      message:
        'A valid user-issued access token is required. Run `handoff-app login`, or create a CI token in registry Account settings.',
    };
  }
  if (!registryPrincipalHasScope(principal, scope)) {
    return {
      ok: false,
      code: 'forbidden',
      message: `This access token does not include the ${scope} scope.`,
    };
  }
  return { ok: true, principal };
};
