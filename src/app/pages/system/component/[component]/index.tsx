'use client';
import { MarkdownComponents } from '@/components/Markdown/MarkdownComponents';
import { getClientConfig } from '@handoff/config';
import { OptionalPreviewRender } from '@handoff/transformers/preview/types';
import { PreviewObject } from '@handoff/types';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPreview } from '../../../../components/Component/Preview';
import { PreviewContextProvider } from '../../../../components/context/PreviewContext';
import Layout from '../../../../components/Layout/Main';
import { CodeHighlight } from '../../../../components/Markdown/CodeHighlight';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import HeadersType from '../../../../components/Typography/Headers';
import { Button } from '../../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../../components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { fetchComponents, getCurrentSection, IParams, staticBuildMenu } from '../../../../components/util';

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

type GroupedPreviews = [string, Record<string, OptionalPreviewRender>][];

const groupPreviewsByVariantProperty = (items: Record<string, OptionalPreviewRender>, variantProperty: string): GroupedPreviews => {
  const grouped: GroupedPreviews = [];

  for (const itemId of Object.keys(items)) {
    const item = items[itemId];
    const typeProperty = item.values[variantProperty];

    if (!typeProperty) continue;

    const typeValue = typeProperty;
    const groupIndex = grouped.findIndex((el) => el[0] === typeValue);

    // const itemToAdd = { ...item };
    // itemToAdd.values = Object.fromEntries(Object.entries(itemToAdd.values).filter(([key]) => key !== variantProperty));

    if (groupIndex === -1) {
      grouped.push([typeValue, { [itemId]: item }]);
    } else {
      grouped[groupIndex][1][itemId] = item;
    }
  }

  return grouped;
};

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getStaticProps = async (context) => {
  const { component } = context.params as IParams;
  // get previews for components on this page
  // const previews = getPreview();

  // const componentObject = getTokens().components[reduceSlugToString(component)] ?? null;
  // const isFigmaComponent = false;

  const menu = staticBuildMenu();
  const config = getClientConfig();
  const metadata = await fetchComponents().filter((c) => c.id === component)[0];
  return {
    props: {
      id: component,
      // isFigmaComponent: true,
      previews: { components: {} },
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

const GenericComponentPage = ({ menu, metadata, current, id, config }) => {
  const [component, setComponent] = useState<PreviewObject>(undefined);
  const ref = React.useRef<HTMLDivElement>(null);
  const [componentPreviews, setComponentPreviews] = useState<PreviewObject | [string, PreviewObject][]>();

  const fetchComponents = async () => {
    let data = await fetch(`/api/component/${id}/latest.json`).then((res) => res.json());
    setComponent(data as PreviewObject);
  };

  useEffect(() => {
    fetchComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!component) return;

    if (!!component.preview_options?.group_by) {
      const groups = groupPreviewsByVariantProperty(component.previews, component.preview_options.group_by);
      setComponentPreviews(
        groups.map(([group, previewObjects]) => [
          toTitleCase(`${group} ${id}`),
          { ...component, id: `${id}-${group}`, previews: previewObjects } as PreviewObject,
        ])
      );
    } else {
      setComponentPreviews(component);
    }
  }, [component, id]);

  if (!component) return <p>Loading...</p>;
  const apiUrl = (window.location.origin && window.location.origin) + `/api/component/${id}/latest.json`;
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-3 pb-14">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <div className="flex flex-row justify-between gap-4 md:flex-col">
          <ReactMarkdown
            className="prose max-w-[800px] text-xl  font-light leading-relaxed text-gray-600 dark:text-gray-300"
            components={MarkdownComponents}
            rehypePlugins={[rehypeRaw]}
          >
            {metadata.description}
          </ReactMarkdown>
          {/*<p className="">
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
          </p>*/}
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
          {Array.isArray(componentPreviews) ? (
            <>
              {componentPreviews.map(([title, cp], cpi) => (
                <>
                  <PreviewContextProvider id={id} defaultMetadata={metadata} defaultMenu={menu} defaultPreview={cp} defaultConfig={config}>
                    <ComponentPreview title={title} bestPracticesCard={cpi === 0} properties={cpi === componentPreviews.length - 1}>
                      <p>Define a simple contact form</p>
                    </ComponentPreview>
                  </PreviewContextProvider>
                </>
              ))}
            </>
          ) : (
            <>
              <PreviewContextProvider
                id={id}
                defaultMetadata={metadata}
                defaultMenu={menu}
                defaultPreview={componentPreviews}
                defaultConfig={config}
              >
                <ComponentPreview title={metadata.title}>
                  <p>Define a simple contact form</p>
                </ComponentPreview>
              </PreviewContextProvider>
            </>
          )}
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
        {Array.isArray(componentPreviews) ? (
          <AnchorNav
            groups={[
              {
                'best-practices': 'Best Practices',
                ...componentPreviews.reduce((acc, [title, previewObject]) => ({ ...acc, [previewObject.id]: title }), {}),
                'code-highlight': 'Code Samples',
                properties: 'Properties',
              },
            ]}
          />
        ) : (
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
        )}
      </div>
    </Layout>
  );
};
export default GenericComponentPage;
