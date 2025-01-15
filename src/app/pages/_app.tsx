import type { AppProps } from 'next/app';

import '../css/index.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* @ts-ignore */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
