import { useRouter } from 'next/router';
import { useEffect, type ReactNode } from 'react';
import { loadInstallStatus } from './installStatus';

const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

/** Keep every registry browser page on the one-time installer until setup is complete. */
export function RegistryInstallGate({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isRegistryRuntime || !router.isReady || router.pathname === '/install') return;
    void loadInstallStatus().then(async (status) => {
      if (status?.installed === false) await router.replace('/install');
    });
  }, [router]);

  return <>{children}</>;
}
