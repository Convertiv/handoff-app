import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { HOME_PAGE_ID } from '@handoff/registry/content-kinds';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents, remarkCodeMeta } from '../../components/Markdown/MarkdownComponents';
import { PageTOC } from '../../components/Navigation/AnchorNav';
import NotFound from '../../components/NotFound';
import HeadersType from '../../components/Typography/Headers';
import defaultPages from '../../generated/default-pages.json';
import {
  buildCatchAllStaticPaths,
  DocumentationProps,
  fetchDocPageMarkdown,
  getClientRuntimeConfig,
  getNavProps,
  isRegistryRuntime,
} from '../../components/util';
import { resolveDocsBackend } from '../../lib/docs-api/backend';
import { BakedDefaultPage, documentationMetadata, REGISTRY_PAGE_REVALIDATE_SECONDS } from '../../lib/docs-api/page-rendering';
import { Home, getStaticProps as getHomeStaticProps } from '../index';

type CatchAllDocumentationProps = DocumentationProps & { homeAlias?: boolean };

export async function getStaticPaths() {
  // Registry resolves every catch-all page on demand so a cold serverless instance queries the DB
  // before it can cache a package default. Defaults are baked into the server bundle as JSON.
  // Workspace/static stays fully prerendered from markdown (workspace pages included).
  if (isRegistryRuntime()) {
    return { paths: [], fallback: 'blocking' as const };
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

  // Registry mode resolves published content first, then the package-default fallback baked during
  // the build. Workspace markdown is never read and the deployed server needs no build-machine path.
  if (isRegistryRuntime()) {
    const id = slug.join('/');
    // Next shares the root ISR cache key with its internal `/index` data alias. The public URL
    // redirects to `/`, but any internal alias regeneration must still produce the same home page.
    if (id === HOME_PAGE_ID) {
      const result = await getHomeStaticProps(context);
      if ('props' in result) {
        return { ...result, props: { ...(await result.props), homeAlias: true } };
      }
      return result;
    }
    const detail = await (await resolveDocsBackend()).getPageDetail(id);
    if (detail) {
      const navProps = await getNavProps(sectionId);
      return {
        props: {
          metadata: documentationMetadata(detail as unknown as Record<string, unknown>),
          content: detail.content,
          ...navProps,
          config,
        },
        revalidate: REGISTRY_PAGE_REVALIDATE_SECONDS,
      };
    }

    const defaultPage = (defaultPages as Record<string, BakedDefaultPage>)[id];
    if (defaultPage) {
      const navProps = await getNavProps(sectionId);
      return {
        props: {
          metadata: documentationMetadata(defaultPage.metadata),
          content: defaultPage.content,
          ...navProps,
          config,
        },
        revalidate: REGISTRY_PAGE_REVALIDATE_SECONDS,
      };
    }

    return { notFound: true, revalidate: REGISTRY_PAGE_REVALIDATE_SECONDS };
  }

  return {
    props: {
      ...(await fetchDocPageMarkdown(docPath, file, sectionId)).props,
      config,
    },
  };
};

export default function DocCatchAllPage({
  content,
  menu,
  metadata,
  current,
  config,
  navData,
  currentSectionId,
  homeAlias,
}: CatchAllDocumentationProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  if (homeAlias) {
    return (
      <Home
        content={content}
        menu={menu}
        metadata={metadata}
        current={current}
        config={config}
        navData={navData}
        currentSectionId={currentSectionId}
      />
    );
  }

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
