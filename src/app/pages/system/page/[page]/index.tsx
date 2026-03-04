'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Cards, { Card } from '../../../../components/Component/Cards';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import PrevNextNav from '../../../../components/Navigation/PrevNextNav';
import { PagePreviewObject } from '../../../../components/Page/types';
import HeadersType from '../../../../components/Typography/Headers';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../../components/ui/drawer';
import { JsonTreeView } from '../../../../components/ui/json-tree-view';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { fetchPages, getClientRuntimeConfig, getCurrentSection, IParams, staticBuildMenu } from '../../../../components/util';

export async function getStaticPaths() {
  return {
    paths: fetchPages()?.map((p) => ({ params: { page: p.id } })) ?? [],
    fallback: false,
  };
}

export const getStaticProps = async (context: { params: IParams }) => {
  const { page } = context.params as { page: string };
  const pages = fetchPages()!;
  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();
  const metadata = pages.find((p) => p.id === page);
  const sameGroupPages = pages.filter((p) => p.group === metadata?.group);
  const groupIndex = sameGroupPages.findIndex((p) => p.id === page);
  const previousPage = sameGroupPages[groupIndex - 1] ?? null;
  const nextPage = sameGroupPages[groupIndex + 1] ?? null;

  return {
    props: {
      id: page,
      menu,
      config,
      current: getCurrentSection(menu, '/system') ?? [],
      metadata: {
        ...metadata,
        title: metadata?.name || metadata?.title,
        description: metadata?.description,
        image: 'hero-brand-assets',
      },
      previousPage,
      nextPage,
    },
  };
};

const PageDetailPage = ({ menu, metadata, current, id, config, previousPage, nextPage }) => {
  const [page, setPage] = useState<PagePreviewObject>(undefined);
  const [selectedPreview, setSelectedPreview] = useState<string>('');
  const ref = React.useRef<HTMLDivElement>(null);

  const appBasePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const normalizedBasePath = appBasePath ? `/${appBasePath.replace(/^\/+|\/+$/g, '')}` : '';
  const pageRoute = (pageId: string) => `${normalizedBasePath}/system/page/${pageId}`;

  const fetchPageData = async () => {
    try {
      const data = await fetch(`${normalizedBasePath}/api/page/${id}.json`).then((res) => res.json());
      setPage(data as PagePreviewObject);
      const previewKeys = Object.keys(data.previews || {});
      if (previewKeys.length > 0) {
        setSelectedPreview(previewKeys[0]);
      }
    } catch {
      setPage(null);
    }
  };

  const previousLink = previousPage
    ? { href: pageRoute(previousPage.id), title: previousPage.name || previousPage.title }
    : null;
  const nextLink = nextPage
    ? { href: pageRoute(nextPage.id), title: nextPage.name || nextPage.title }
    : null;

  useEffect(() => {
    setPage(undefined);
    fetchPageData();
  }, [id]);

  if (!page) return <p>Loading...</p>;

  const apiUrl = (window.location.origin && window.location.origin) + `/api/page/${id}.json`;
  const previewKeys = Object.keys(page.previews || {});
  const currentPreview = page.previews?.[selectedPreview];
  const previewUrl = currentPreview?.url ? `${normalizedBasePath}/api/page/${currentPreview.url}` : '';

  const bestPracticesCards: Card[] = [];
  if (page.should_do && page.should_do.length > 0) {
    bestPracticesCards.push({ title: 'Best Practices', content: page.should_do.join('\n'), type: 'positive' });
  }
  if (page.should_not_do && page.should_not_do.length > 0) {
    bestPracticesCards.push({ title: 'Common Mistakes', content: page.should_not_do.join('\n'), type: 'negative' });
  }

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-3 pb-14">
        <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Pages</small>
        <a id="best-practices"></a>
        <HeadersType.H1>{metadata.title || page.title}</HeadersType.H1>
        <div className="flex flex-row justify-between gap-4 md:flex-col">
          <div className="prose max-w-[800px] text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {metadata.description || page.description}
            </ReactMarkdown>
          </div>
          <div className="flex flex-row gap-3">
            {page.figma && (
              <Button asChild variant={'outline'} size={'sm'} className="font-normal [&_svg]:size-3!">
                <a href={page.figma} target="_blank">
                  Figma Reference
                </a>
              </Button>
            )}
            <Drawer direction="right">
              <DrawerTrigger>
                <Button variant="outline" size={'sm'} className="font-normal [&_svg]:size-3!">
                  API Reference
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-5 w-full max-w-lg">
                  <DrawerHeader>
                    <DrawerTitle>API Response</DrawerTitle>
                    <p className="font-mono text-xs text-gray-500">{apiUrl}</p>
                  </DrawerHeader>
                  <div className="max-h-[80vh] w-full overflow-auto">
                    <JsonTreeView data={page} />
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      <div ref={ref} className="lg:gap-10 lg:pb-8 xl:grid xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="max-w-[900px]">
          {bestPracticesCards.length > 0 && (
            <div id="best-practices" className="flex flex-col gap-2 pb-7">
              <Cards cards={bestPracticesCards} />
            </div>
          )}

          <a id="preview"></a>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <HeadersType.H2>Preview</HeadersType.H2>
              {previewKeys.length > 1 && (
                <Select value={selectedPreview} onValueChange={setSelectedPreview}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select preview" />
                  </SelectTrigger>
                  <SelectContent>
                    {previewKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        {page.previews[key].title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {previewUrl && (
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  src={previewUrl}
                  className="w-full border-0"
                  style={{ minHeight: '500px' }}
                  title={`${page.title} - ${currentPreview?.title || 'Preview'}`}
                />
              </div>
            )}
          </div>

          <a id="components"></a>
          <div className="mb-8">
            <HeadersType.H2 className="mb-4">Components</HeadersType.H2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This page is composed of the following components in order:
            </p>
            <div className="flex flex-col gap-2">
              {(page.components || []).map((componentId, index) => (
                <div key={`${componentId}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge variant="outline" className="font-mono text-xs">
                    {index + 1}
                  </Badge>
                  <Link href={`/system/component/${componentId}`} className="text-sm font-medium text-sky-600 hover:underline">
                    {componentId}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <hr className="mt-8" />
          <PrevNextNav previous={previousLink} next={nextLink} />
        </div>

        <AnchorNav
          groups={[
            {
              ...(bestPracticesCards.length > 0 ? { 'best-practices': 'Best Practices' } : {}),
              preview: 'Preview',
              components: 'Components',
            },
          ]}
        />
      </div>
    </Layout>
  );
};

export default PageDetailPage;
