import type { AppProps } from 'next/app';

import { NavProvider } from '../components/context/NavProvider';
import '../css/index.css';
import '../css/theme.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // NavProvider lives above the page tree so the registry nav (shell + entities) is fetched once
    // and cached across soft navigations, resetting only on hard refresh.
    <NavProvider>
      {/* @ts-ignore */}
      <Component {...pageProps} />
    </NavProvider>
  );
}

export default MyApp;
