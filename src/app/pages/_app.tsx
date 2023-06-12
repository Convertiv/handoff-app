import type { AppProps } from 'next/app';

import Footer from '../components/Footer';
import Header from '../components/Header';
import { GetStaticProps } from 'next';
import { fetchDocPageMarkdown, IParams } from '../components/util';
import '../sass/main.scss';



function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Footer />
    </>
  );
}

export default MyApp;
