import Layout from '@/components/Layout/Main';
import HeadersType from '@/components/Typography/Headers';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import {
  buildL2StaticPaths,
  DocumentationProps,
  fetchDocPageMarkdown,
  getClientRuntimeConfig,
  IParams,
  reduceSlugToString,
} from '../../components/util';

export interface SubPageType {
  params: {
    level1: string;
    level2: string;
  };
}
/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: buildL2StaticPaths(),
    fallback: false,
  };
}
/**
 * Get all the markdown data, build a menu tree, and then fetch the contents
 * of the current page for rendering
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  let { level2 } = context.params as IParams;
  if (!level2) {
    level2 = '404';
  }
  return {
    props: {
      ...fetchDocPageMarkdown(`docs/system/`, reduceSlugToString(level2), `/system`).props,
      config: getClientRuntimeConfig(),
    },
  };
};

/**
 * Render Docs page
 * @param param0
 * @returns
 */
export default function DocSubPage({ content, menu, metadata, current, config }: DocumentationProps) {
  if (content) {
    return (
      <Layout config={config} menu={menu} current={current} metadata={metadata}>
        <div className="flex flex-col gap-2 pb-7">
          <HeadersType.H1>{metadata.title}</HeadersType.H1>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
        </div>
        <div>
          <div className="prose mb-10">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </Layout>
    );
  } else {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
        <Head>
          <title>404 - Page Not Found</title>
          <meta name="description" content="Page Not Found" />
        </Head>
        <div className="flex flex-col items-center">
          <div className="mb-2 text-7xl font-bold text-gray-800 dark:text-white">404</div>
          <h1 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">Oops! Page not found.</h1>
          <p className="mb-6 max-w-md text-center text-gray-500 dark:text-gray-400">
            Sorry, the page you are looking for does not exist or has been moved.
            <br />
            Please check the URL or return to the homepage.
          </p>
          <a
            href="/"
            className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }
}
