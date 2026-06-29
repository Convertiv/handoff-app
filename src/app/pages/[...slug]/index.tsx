import fs from 'fs-extra';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import path from 'path';
import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents, remarkCodeMeta } from '../../components/Markdown/MarkdownComponents';
import { PageTOC } from '../../components/Navigation/AnchorNav';
import NotFound from '../../components/NotFound';
import HeadersType from '../../components/Typography/Headers';
import {
  buildCatchAllStaticPaths,
  DocumentationProps,
  fetchDocPageMarkdown,
  getClientRuntimeConfig,
  isRegistryRuntime,
} from '../../components/util';
import { resolveDocsBackend } from '../../lib/docs-api/backend';

export async function getStaticPaths() {
  // Registry prerenders the package `config/docs` catch-all pages (workspace `pages/` excluded —
  // those are DB-served), and resolves DB-published pages on demand via `fallback: 'blocking'`.
  // Workspace/static stays fully prerendered from markdown (pages included).
  if (isRegistryRuntime()) {
    return { paths: buildCatchAllStaticPaths(false), fallback: 'blocking' as const };
  }
  return {
    paths: buildCatchAllStaticPaths(),
    fallback: false,
  };
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params as { slug: string[] };
  const config = getClientRuntimeConfig();
  const dirParts = slug.slice(0, -1);
  const file = slug[slug.length - 1];
  const docPath = dirParts.length > 0 ? `docs/${dirParts.join('/')}/` : 'docs/';
  const sectionId = `/${slug[0]}`;

  // Registry mode: package `config/docs` pages are served from disk (prerendered at build); only
  // DB-published custom pages are resolved from the registry database. Workspace markdown is never
  // read. The nav is filled client-side from `/api/docs/nav.json`, so DB pages carry an empty menu.
  if (isRegistryRuntime()) {
    const id = slug.join('/');
    const moduleDoc = path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config', 'docs', `${id}.md`);
    if (fs.existsSync(moduleDoc)) {
      return {
        props: {
          ...(await fetchDocPageMarkdown(docPath, file, sectionId)).props,
          config,
        },
      };
    }

    const detail = await (await resolveDocsBackend()).getPageDetail(id);
    if (!detail) {
      return { notFound: true };
    }
    return {
      props: {
        metadata: {
          title: detail.title ?? '',
          description: detail.description ?? '',
          metaTitle: detail.metaTitle ?? detail.title ?? '',
          metaDescription: detail.metaDescription ?? detail.description ?? '',
        },
        content: detail.content,
        menu: [],
        current: null,
        config,
      },
    };
  }

  return {
    props: {
      ...(await fetchDocPageMarkdown(docPath, file, sectionId)).props,
      config,
    },
  };
};

export default function DocCatchAllPage({ content, menu, metadata, current, config }: DocumentationProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  if (!content && !metadata?.title) {
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
