import { ArrowRight, Badge, Webhook } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../../components/Layout/Main';
import { MarkdownComponents } from '../../../components/Markdown/MarkdownComponents';
import { APIPageList } from '../../../components/Page/PageLists';
import { PagePreviewObject } from '../../../components/Page/types';
import HeadersType from '../../../components/Typography/Headers';
import { Button } from '../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../components/ui/drawer';
import { JsonTreeView } from '../../../components/ui/json-tree-view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { DocumentationProps, fetchDocPageMarkdown, getClientRuntimeConfig } from '../../../components/util';

type PageListDocumentationProps = DocumentationProps;

export const getStaticProps: GetStaticProps = async () => {
  const config = getClientRuntimeConfig();
  return {
    props: {
      config,
      ...fetchDocPageMarkdown('docs/', 'system', `/system`).props,
    } as PageListDocumentationProps,
  };
};

const PagesPage = ({ content, menu, metadata, current, config }: PageListDocumentationProps) => {
  const [pages, setPages] = useState<PagePreviewObject[]>(undefined);

  const fetchPages = async () => {
    try {
      const data = await fetch(`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/pages.json`).then((res) => res.json());
      setPages(data as PagePreviewObject[]);
    } catch {
      setPages([]);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  if (!pages) return <p>Loading...</p>;

  if (pages.length === 0) {
    return (
      <Layout config={config} menu={menu} current={current} metadata={metadata}>
        <div className="flex items-center justify-center flex-col gap-2 lg:pr-8">
          <div className="mb-3 flex items-center justify-center overflow-hidden">
            <Image
              src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/components.svg`}
              alt="Pages"
              width={'327'}
              height="220"
            />
          </div>
          <h3 className="text-base font-medium">No Pages</h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">Start by adding page definitions to your pages folder.</p>
          <Button asChild variant="link" className="px-0 text-sm font-medium text-gray-900 hover:no-underline dark:text-gray-100">
            <a href="https://www.handoff.com/docs/" target="_blank" rel="noopener noreferrer">
              View Docs
              <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      </Layout>
    );
  }

  const apiUrl = (window.location.origin && window.location.origin) + `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/pages.json`;

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>Pages</HeadersType.H1>
        <div className="mt-3 flex flex-row justify-between gap-3">
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Composed page templates built from reusable components.
          </p>
          <Drawer direction="right">
            <DrawerTrigger>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">
                      API <Webhook strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <Badge>{apiUrl}</Badge>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-5 w-full max-w-lg">
                <DrawerHeader>
                  <DrawerTitle>API Response</DrawerTitle>
                  <p className="font-mono text-xs text-gray-500">{apiUrl}</p>
                </DrawerHeader>
                <div className="max-h-[80vh] w-full overflow-auto">
                  <JsonTreeView data={pages} />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
      <div>
        <div className="prose mb-10">
          <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        </div>
        <APIPageList pages={pages} />
      </div>
    </Layout>
  );
};

export default PagesPage;
