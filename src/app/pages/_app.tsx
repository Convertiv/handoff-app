import type { AppProps } from 'next/app';

import '../sass/main.scss';



function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />

    </>
  );
}

export default MyApp;
