'use client';
import { CodeHighlight } from '@/components/Markdown/CodeHighlight';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getClientConfig } from '@handoff/config';
import { PreviewObject } from '@handoff/types';
import { SelectItem } from '@radix-ui/react-select';
import { TooltipContent } from '@radix-ui/react-tooltip';
import { Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ComponentPreview } from '../../../../components/Component/Preview';
import { PreviewContextProvider } from '../../../../components/context/PreviewContext';
import Layout from '../../../../components/Layout/Main';
import HeadersType from '../../../../components/Typography/Headers';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { fetchComponents, getCurrentSection, getPreview, IParams, staticBuildMenu } from '../../../../components/util';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: fetchComponents().map((exportable) => ({ params: { component: exportable.id } })),
    fallback: false, // can also be true or 'blocking'
  };
}

export const getStaticProps = async (context) => {
  const { component } = context.params as IParams;
  // get previews for components on this page
  const previews = getPreview();
  const menu = staticBuildMenu();
  const config = getClientConfig();
  const metadata = await fetchComponents().filter((c) => c.id === component)[0];
  return {
    props: {
      id: component,
      previews,
      menu,
      config,
      current: getCurrentSection(menu, '/system') ?? [],
      metadata: {
        ...metadata,
        title: metadata.name,
        description: metadata.description,
        image: 'hero-brand-assets',
      },
    },
  };
};

const GenericComponentPage = ({ menu, metadata, current, id, config, previews }) => {
  const [component, setComponent] = useState<PreviewObject>(undefined);
  const fetchComponents = async () => {
    let data = await fetch(`/api/component/${id}/latest.json`).then((res) => res.json());
    setComponent(data as PreviewObject);
  };
  useEffect(() => {
    fetchComponents();
  }, []);
  if (!component) return <p>Loading...</p>;
  const apiUrl = (window.location.origin && window.location.origin) + `/api/component/${id}/latest.json`;
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <div className="mt-3 flex flex-row justify-between gap-3">
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            {metadata.description}
            {component.tags &&
              Array.isArray(component.tags) &&
              component.tags.map((tag) => (
                <>
                  &nbsp;
                  <Badge variant={'default'} className="px-2 py-0 text-[11px]">
                    {tag}
                  </Badge>
                </>
              ))}
          </p>
          <div>
            <Select
            // defaultValue={breakpoint}
            // onValueChange={(key) => {
            //   setBreakpoint(key);
            //   setWidth(`${breakpoints[key].size}px`);
            // }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Latest</SelectItem>
              </SelectContent>
            </Select>

            <Drawer direction="right">
              <DrawerTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <>
                        Component API <Webhook strokeWidth={1.5} />
                      </>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <Badge>{apiUrl}</Badge>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DrawerTrigger>
              <DrawerContent>
                <div className="w-md mx-5">
                  <DrawerHeader>
                    <DrawerTitle>API Response</DrawerTitle>
                  </DrawerHeader>
                  <div className="w-full">
                    <CodeHighlight
                      title={apiUrl}
                      language="json"
                      type="json"
                      data={JSON.stringify(component, null, 2)}
                      dark={true}
                      height="80vh"
                    />
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          <PreviewContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={previews} defaultConfig={config}>
            <ComponentPreview title={metadata.title} id={id}>
              <p>Define a simple contact form</p>
            </ComponentPreview>
          </PreviewContextProvider>
        </div>
      </div>
    </Layout>
  );
};
export default GenericComponentPage;
