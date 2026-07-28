import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextAuthOptions, Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  authenticateRegistryCredentials,
  clearAuthRateLimit,
  consumeAuthRateLimit,
  getRegistryInstallationState,
  getRegistryUserById,
  normalizeEmail,
  type RegistryUser,
} from '@handoff/registry/auth';
import { getRegistryConnection } from '../registry-connection';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';

export const registryAuthSecret = (): string => process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || '';

const appBasePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

const requestIdentifier = (request: { headers?: Record<string, string | string[] | undefined> }, email: string): string => {
  const forwarded = request.headers?.['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const address = forwardedValue?.split(',')[0]?.trim() || request.headers?.['x-real-ip'] || 'unknown';
  return `${String(address)}:${normalizeEmail(email)}`;
};

const clearUserToken = (token: Record<string, unknown>): Record<string, unknown> => {
  delete token.sub;
  delete token.userId;
  delete token.role;
  delete token.authVersion;
  token.authInvalid = true;
  return token;
};

export const registryAuthOptions: NextAuthOptions = {
  secret: registryAuthSecret() || 'registry-auth-is-not-configured',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 5 * 60,
  },
  pages: {
    signIn: `${appBasePath}/login`,
    error: `${appBasePath}/login`,
  },
  providers: [
    CredentialsProvider({
      id: 'handoff-credentials',
      name: 'Handoff Registry',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (getServerRuntimeConfig().mode !== 'registry' || !registryAuthSecret()) return null;
        const email = credentials?.email ?? '';
        const password = credentials?.password ?? '';
        if (!email || !password) return null;

        try {
          const { db } = await getRegistryConnection();
          const installation = await getRegistryInstallationState(db);
          if (installation.status !== 'installed') return null;

          const identifier = requestIdentifier(request, email);
          const throttle = await consumeAuthRateLimit(db, {
            bucket: 'login',
            identifier,
            limit: 10,
            windowMs: 15 * 60 * 1000,
          });
          if (!throttle.allowed) return null;

          const user = await authenticateRegistryCredentials(db, email, password);
          if (!user) return null;
          await clearAuthRateLimit(db, 'login', identifier);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            status: user.status,
            authVersion: user.authVersion,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const mutable = token as Record<string, unknown>;
      const userId = (user?.id as string | undefined) || (mutable.userId as string | undefined) || token.sub;
      const issuedAuthVersion = user ? (user as { authVersion?: number }).authVersion : (mutable.authVersion as number | undefined);
      if (!userId || getServerRuntimeConfig().mode !== 'registry') return clearUserToken(mutable);

      try {
        const { db } = await getRegistryConnection();
        const current = await getRegistryUserById(db, userId);
        if (!current || current.status !== 'active') return clearUserToken(mutable);
        if (!user && issuedAuthVersion !== current.authVersion) return clearUserToken(mutable);
        mutable.userId = current.id;
        mutable.email = current.email;
        mutable.name = current.name;
        mutable.picture = current.image;
        mutable.role = current.role;
        mutable.authVersion = current.authVersion;
        mutable.authInvalid = false;
      } catch {
        return clearUserToken(mutable);
      }
      return token;
    },
    async session({ session, token }) {
      const values = token as Record<string, unknown>;
      if (values.authInvalid || !values.userId) {
        session.user = undefined as unknown as Session['user'];
        return session;
      }
      session.user = {
        id: values.userId as string,
        email: (values.email as string) || '',
        name: (values.name as string | null) ?? null,
        image: (values.picture as string | null) ?? null,
        role: values.role as RegistryUser['role'],
        authVersion: values.authVersion as number,
      };
      return session;
    },
  },
};

/** Resolve the current session and re-read its user so every protected request sees live account state. */
export const getRegistrySessionUser = async (req: NextApiRequest, res: NextApiResponse): Promise<RegistryUser | null> => {
  if (getServerRuntimeConfig().mode !== 'registry' || !registryAuthSecret()) return null;
  const session = await getServerSession(req, res, registryAuthOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const { db } = await getRegistryConnection();
  const user = await getRegistryUserById(db, userId);
  return user?.status === 'active' ? user : null;
};
