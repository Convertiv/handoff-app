'use client';
import { OptionalPreviewRender } from '@handoff/transformers/preview/types';
import { PreviewObject } from '@handoff/types';
import { evaluateFilter, type Filter } from '@handoff/utils/filter';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ComponentPreview } from '../../../../components/Component/Preview';
import { HotReloadProvider } from '../../../../components/context/HotReloadProvider';
import { PreviewContextProvider } from '../../../../components/context/PreviewContext';
import Layout from '../../../../components/Layout/Main';
import { CodeHighlight } from '../../../../components/Markdown/CodeHighlight';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import PrevNextNav from '../../../../components/Navigation/PrevNextNav';
import HeadersType from '../../../../components/Typography/Headers';
import { Button } from '../../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../../components/ui/drawer';
import { fetchComponents, getClientRuntimeConfig, getCurrentSection, IParams, staticBuildMenu } from '../../../../components/util';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: fetchComponents()?.map((exportable) => ({ params: { component: exportable.id } })) ?? [],
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

  // const componentObject = getTokens().components[reduceSlugToString(component)] ?? null;
  // const isFigmaComponent = false;
  const components = fetchComponents()!;
  const componentIndex = components.findIndex((c) => c.id === component);
  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();
  const metadata = components.filter((c) => c.id === component)[0];
  const componentHotReloadIsAvailable = process.env.NODE_ENV === 'development';
  const previousComponent = components[componentIndex - 1] ?? null;
  const nextComponent = components[componentIndex + 1] ?? null;

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
      componentHotReloadIsAvailable,
      previousComponent,
      nextComponent,
    },
  };
};

function filterPreviews(previews: Record<string, OptionalPreviewRender>, filter: Filter): Record<string, OptionalPreviewRender> {
  return Object.fromEntries(Object.entries(previews).filter(([_, preview]) => evaluateFilter(preview.values, filter)));
}

const GenericComponentPage = ({ menu, metadata, current, id, config, componentHotReloadIsAvailable, previousComponent, nextComponent }) => {
  const [component, setComponent] = useState<PreviewObject>(undefined);
  const ref = React.useRef<HTMLDivElement>(null);
  const [componentPreviews, setComponentPreviews] = useState<PreviewObject | [string, PreviewObject][]>();

  const fetchComponents = async () => {
    let data = await fetch(`/api/component/${id}.json`).then((res) => res.json());
    setComponent(data as PreviewObject);
  };

  const previousLink = previousComponent ? {
    href: previousComponent ? '/system/component/' + previousComponent.id : null,
    title: previousComponent ? previousComponent.name : null,
  } : null;
  const nextLink = nextComponent ? {
    href: '/system/component/' + nextComponent.id,
    title: nextComponent.name,
  } : null;

  useEffect(() => {
    fetchComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!component) return;

    let filteredPreviews = component.previews;
    if (component.options?.preview?.filterBy) {
      filteredPreviews = filterPreviews(component.previews, component.options.preview.filterBy);
    }

    if (!!component.options?.preview?.groupBy) {
      const groups = groupPreviewsByVariantProperty(filteredPreviews, component.options.preview.groupBy);
      setComponentPreviews(
        groups.map(([group, previewObjects]) => [
          toTitleCase(`${group} ${id}`),
          { ...component, id: `${id}-${group}`, previews: previewObjects } as PreviewObject,
        ])
      );
    } else {
      setComponentPreviews({ ...component, previews: filteredPreviews });
    }
  }, [component, id]);

  if (!component) return <p>Loading...</p>;
  const apiUrl = (window.location.origin && window.location.origin) + `/api/component/${id}.json`;
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-3 pb-14">
        <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Components</small>
        <a id="best-practices"></a>
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <div className="flex flex-row justify-between gap-4 md:flex-col">
          <div className="prose max-w-[800px] text-xl  font-light leading-relaxed text-gray-600 dark:text-gray-300">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {metadata.description}
            </ReactMarkdown>
          </div>
          <div className="flex flex-row gap-3">
            {component.figma && (
              <Button asChild variant={'outline'} size={'sm'} className="font-normal [&_svg]:size-3!">
                <a href={component.figma} target="_blank">
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
            <HotReloadProvider connect={componentHotReloadIsAvailable}>
              {componentPreviews.map(([title, cp], cpi) => (
                <>
                  <PreviewContextProvider id={id} defaultMetadata={metadata} defaultMenu={menu} defaultPreview={cp} defaultConfig={config}>
                    <ComponentPreview
                      title={title}
                      bestPracticesCard={cpi === 0}
                      properties={cpi === componentPreviews.length - 1}
                      validations={cpi === componentPreviews.length - 1}
                    >
                      <p>Define a simple contact form</p>
                    </ComponentPreview>
                  </PreviewContextProvider>
                </>
              ))}
            </HotReloadProvider>
          ) : (
            <HotReloadProvider connect={componentHotReloadIsAvailable}>
              <PreviewContextProvider
                id={id}
                defaultMetadata={metadata}
                defaultMenu={menu}
                defaultPreview={componentPreviews}
                defaultConfig={config}
              >
                <ComponentPreview title={metadata.title} properties={true} validations={true}>
                  <p>Define a simple contact form</p>
                </ComponentPreview>
              </PreviewContextProvider>
            </HotReloadProvider>
          )}
          <hr className="mt-8" />
          <PrevNextNav previous={previousLink} next={nextLink} />
        </div>
        {Array.isArray(componentPreviews) ? (
          <AnchorNav
            groups={[
              {
                'best-practices': 'Best Practices',
                ...componentPreviews.reduce((acc, [title, previewObject]) => ({ ...acc, [previewObject.id]: title }), {}),
                'code-highlight': 'Code Samples',
                properties: 'Properties',
                validations: 'Validations',
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
                validations: 'Validations',
              },
            ]}
          />
        )}
      </div>
    </Layout>
  );
};
export default GenericComponentPage;
