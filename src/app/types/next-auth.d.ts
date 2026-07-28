import type { DefaultSession } from 'next-auth';
import type { RegistryUserRole } from '@handoff/registry/auth';

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string;
      role: RegistryUserRole;
      authVersion: number;
    };
  }

  interface User {
    role: RegistryUserRole;
    status: string;
    authVersion: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: RegistryUserRole;
    authVersion?: number;
    authInvalid?: boolean;
  }
}
