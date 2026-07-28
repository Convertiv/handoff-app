import type { AppProps } from 'next/app';

import { RegistrySessionProvider } from '../components/Auth/RegistrySessionProvider';
import { RegistryInstallGate } from '../components/Auth/RegistryInstallGate';
import { NavProvider } from '../components/context/NavProvider';
import '../css/index.css';
import '../css/theme.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // NavProvider lives above the page tree so the registry nav (shell + entities) is fetched once
    // and cached across soft navigations, resetting only on hard refresh.
    <RegistrySessionProvider>
      <RegistryInstallGate>
        <NavProvider initialNav={pageProps.navData} currentSectionId={pageProps.currentSectionId}>
          {/* @ts-ignore */}
          <Component {...pageProps} />
        </NavProvider>
      </RegistryInstallGate>
    </RegistrySessionProvider>
  );
}

export default MyApp;
