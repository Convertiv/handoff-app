import { GetStaticProps } from 'next';
import { isRegistryRuntime } from '../../components/util';
import Home, { getStaticProps as getHomeStaticProps } from '../index';

/**
 * Reserve Next's `/index` page and data routes so the catch-all cannot regenerate them under the
 * root ISR cache key. Next still shares that key with `/`, so this alias must regenerate the exact
 * same home page in registry mode. Registry HTML requests are canonicalized by `next.config.mjs`
 * before this runs; workspace/static output does not need an alias page.
 */
export const getStaticProps: GetStaticProps = async (context) =>
  isRegistryRuntime() ? getHomeStaticProps(context) : { notFound: true };

export default Home;
