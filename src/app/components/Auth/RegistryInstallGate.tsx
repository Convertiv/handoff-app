import { useRouter } from 'next/router';
import { useEffect, useRef, type ReactNode } from 'react';
import { authApiUrl } from './api';

const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

/** Keep every registry browser page on the one-time installer until setup is complete. */
export function RegistryInstallGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isInstalled = useRef(false);

  useEffect(() => {
    if (!isRegistryRuntime || isInstalled.current || !router.isReady || router.pathname === '/install') return;
    void fetch(authApiUrl('/api/install'), { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const status = (await response.json()) as { installed?: boolean };
        if (status.installed === false) await router.replace('/install');
        else if (status.installed === true) isInstalled.current = true;
      })
      .catch(() => undefined);
  }, [router]);

  return <>{children}</>;
}
