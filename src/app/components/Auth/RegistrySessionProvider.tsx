import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';
const authBasePath = `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/auth`;

export function RegistrySessionProvider({ children }: { children: ReactNode }) {
  if (!isRegistryRuntime) return <>{children}</>;

  return (
    <SessionProvider basePath={authBasePath} refetchOnWindowFocus refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}
