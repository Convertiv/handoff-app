'use client';
import { getClientConfig } from '@handoff/config';
import { PreviewObject } from '@handoff/types';
import { SelectItem } from '@radix-ui/react-select';
import React, { useEffect, useState } from 'react';
import { ComponentPreview } from '../../../../components/Component/Preview';
import { PreviewContextProvider } from '../../../../components/context/PreviewContext';
import Layout from '../../../../components/Layout/Main';
import { CodeHighlight } from '../../../../components/Markdown/CodeHighlight';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import HeadersType from '../../../../components/Typography/Headers';
import { Button } from '../../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../../components/ui/drawer';
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
  const ref = React.useRef<HTMLDivElement>(null);

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
      <div className="flex flex-col gap-2 pb-14">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <div className="flex flex-row justify-between gap-4 md:flex-col">
          <p className="text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
            {metadata.description}
            {/* {component.tags &&
              Array.isArray(component.tags) &&
              component.tags.map((tag) => (
                <>
                  &nbsp;
                  <Badge variant={'default'} className="px-2 py-0 text-[11px]">
                    {tag}
                  </Badge>
                </>
              ))} */}
          </p>
          <div className="flex flex-row gap-3">
            {component.figma && (
              <Button asChild variant={'outline'} size={'sm'} className="font-normal [&_svg]:!size-3">
                <a href={component.figma} target="_blank">
                  Figma Reference
                </a>
              </Button>
            )}
            <Drawer direction="right">
              <DrawerTrigger>
                <Button variant="outline" size={'sm'} className="font-normal [&_svg]:!size-3">
                  API Reference
                </Button>
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
      <div ref={ref} className="lg:gap-10 lg:pb-8 xl:grid xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="max-w-[900px]">
          <PreviewContextProvider defaultMetadata={metadata} defaultMenu={menu} defaultPreview={previews} defaultConfig={config}>
            <ComponentPreview title={metadata.title} id={id}>
              <p>Define a simple contact form</p>
            </ComponentPreview>
          </PreviewContextProvider>
          <div className="mt-8">
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
          </div>
        </div>
        <AnchorNav
          groups={[
            {
              'best-practices': 'Best Practices',
              preview: 'Previews',
              'code-highlight': 'Code Samples',
              properties: 'Properties',
            },
          ]}
        />
      </div>
    </Layout>
  );
};
export default GenericComponentPage;
