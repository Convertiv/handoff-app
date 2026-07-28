import type { NextApiRequest } from 'next';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import {
  authenticateRegistryAccessToken,
  registryPrincipalHasScope,
  REGISTRY_WRITE_SCOPE,
  type RegistryPrincipal,
} from '@handoff/registry/auth';

export interface MutationAuthResult {
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

/** Authorize registry mutations with a live, revocable user token carrying `registry:write`. */
export const authorizeMutation = async (req: NextApiRequest, db: RegistryDatabase): Promise<MutationAuthResult> => {
  const principal = await authenticateRegistryAccessToken(db, bearerToken(req));
  if (!principal) {
    return {
      ok: false,
      code: 'unauthorized',
      message:
        'A valid user-issued access token is required. Run `handoff-app login`, or create a CI token in registry Account settings.',
    };
  }
  if (!registryPrincipalHasScope(principal, REGISTRY_WRITE_SCOPE)) {
    return {
      ok: false,
      code: 'forbidden',
      message: 'This access token does not include the registry:write scope.',
    };
  }
  return { ok: true, principal };
};
