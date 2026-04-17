import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRef } from 'react';
import NotFound from '../../components/NotFound';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents, remarkCodeMeta } from '../../components/Markdown/MarkdownComponents';
import { PageTOC } from '../../components/Navigation/AnchorNav';
import HeadersType from '../../components/Typography/Headers';
import {
  buildCatchAllStaticPaths,
  DocumentationProps,
  fetchDocPageMarkdown,
  getClientRuntimeConfig,
} from '../../components/util';

export async function getStaticPaths() {
  return {
    paths: buildCatchAllStaticPaths(),
    fallback: false,
  };
}

export const getStaticProps: GetStaticProps = (context) => {
  const { slug } = context.params as { slug: string[] };
  const dirParts = slug.slice(0, -1);
  const file = slug[slug.length - 1];
  const docPath = dirParts.length > 0 ? `docs/${dirParts.join('/')}/` : 'docs/';
  const sectionId = `/${slug[0]}`;

  return {
    props: {
      ...fetchDocPageMarkdown(docPath, file, sectionId).props,
      config: getClientRuntimeConfig(),
    },
  };
};

export default function DocCatchAllPage({ content, menu, metadata, current, config }: DocumentationProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  if (!content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
        <Head>
          <title>404 - Page Not Found</title>
          <meta name="description" content="Page Not Found" />
        </Head>
        <NotFound />
      </div>
    );
  }

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="prose mb-10" ref={bodyRef}>
            <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
        <PageTOC body={bodyRef} title="On This Page" />
      </div>
    </Layout>
  );
}
