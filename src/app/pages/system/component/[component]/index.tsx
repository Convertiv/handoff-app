'use client';
import { buildArtifactUrl } from '@handoff/artifacts/url';
import { OptionalPreviewRender } from '@handoff/transformers/preview/types';
import { PreviewObject } from '@handoff/types/preview';
import { evaluateFilter, type Filter } from '@handoff/utils/filter';
import { startCase } from 'lodash';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { ComponentPreview } from '../../../../components/Component/Preview';
import { RegistryActions } from '../../../../components/Component/RegistryActions';
import { HotReloadProvider } from '../../../../components/context/HotReloadProvider';
import { PreviewContextProvider } from '../../../../components/context/PreviewContext';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents, remarkCodeMeta } from '../../../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import PrevNextNav from '../../../../components/Navigation/PrevNextNav';
import HeadersType from '../../../../components/Typography/Headers';
import { Button } from '../../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../../components/ui/drawer';
import { JsonTreeView } from '../../../../components/ui/json-tree-view';
import { fetchComponents, fetchDocPageMetadataAndContent, getClientRuntimeConfig, getNavProps, IParams, isRegistryRuntime } from '../../../../components/util';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  // Registry content is mutable at runtime and may be empty/unreachable at build time, so resolve
  // component pages on demand against the live DB instead of freezing the path list to the build
  // snapshot. The static-export target stays fully prerendered (`fallback: false`).
  if (isRegistryRuntime()) {
    return { paths: [], fallback: 'blocking' as const };
  }
  return {
    paths: (await fetchComponents()).map((exportable) => ({ params: { component: exportable.id } })),
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
  const components = await fetchComponents();
  const componentData = components.find((c) => c.id === component);
  // Under `fallback: 'blocking'` this runs on demand for arbitrary ids; surface a real 404 for ids
  // that do not exist in the active mode instead of dereferencing an undefined record below.
  if (!componentData) {
    return { notFound: true };
  }
  const navProps = await getNavProps('/system');
  const config = getClientRuntimeConfig();
  const docs = fetchDocPageMetadataAndContent('docs/system/', component as string);
  const componentHotReloadIsAvailable = process.env.NODE_ENV === 'development';
  const sameGroupComponents = components.filter((c) => c.group === componentData?.group);
  const groupIndex = sameGroupComponents.findIndex((c) => c.id === component);
  const previousComponent = sameGroupComponents[groupIndex - 1] ?? null;
  const nextComponent = sameGroupComponents[groupIndex + 1] ?? null;

  const fallbackTitle = componentData.title || startCase(component as string);
  const fallbackMetaTitle = `${fallbackTitle}${config?.app?.client ? ` | ${config.app.client} Design System` : ''}`;

  return {
    props: {
      id: component,
      // isFigmaComponent: true,
      previews: { components: {} },
      ...navProps,
      config,
      metadata: {
        ...componentData,
        title: componentData.title || docs.metadata.title || startCase(component as string),
        description: componentData.description,
        metaTitle: docs.metadata.metaTitle || fallbackMetaTitle,
        metaDescription: docs.metadata.metaDescription || componentData.description,
        image: docs.metadata.image || 'hero-brand-assets',
      },
      componentHotReloadIsAvailable,
      previousComponent,
      nextComponent,
    },
  };
};

function filterPreviews(previews: Record<string, OptionalPreviewRender>, filter: Filter): Record<string, OptionalPreviewRender> {
  return Object.fromEntries(Object.entries(previews).filter(([, preview]) => evaluateFilter(preview.values, filter)));
}

const GenericComponentPage = ({ menu, metadata, current, id, config, componentHotReloadIsAvailable, previousComponent, nextComponent }) => {
  const [component, setComponent] = useState<PreviewObject>(undefined);
  const ref = React.useRef<HTMLDivElement>(null);
  const [componentPreviews, setComponentPreviews] = useState<PreviewObject | [string, PreviewObject][]>();
  const [previewsUnavailable, setPreviewsUnavailable] = useState(false);

  const appBasePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const normalizedBasePath = appBasePath ? `/${appBasePath.replace(/^\/+|\/+$/g, '')}` : '';
  const componentRoute = (componentId: string) => `${normalizedBasePath}/system/component/${componentId}`;

  const componentDataUrl = buildArtifactUrl(`component/${id}.json`, appBasePath);

  const fetchComponents = async (signal: AbortSignal) => {
    try {
      const res = await fetch(componentDataUrl, { signal });
      if (!res.ok) {
        setPreviewsUnavailable(true);
        setComponent(undefined);
        return;
      }
      const data = await res.json();
      setComponent(data as PreviewObject);
    } catch (err) {
      // A superseded fetch (the user navigated to another component before this one resolved) is
      // aborted on effect cleanup; ignore it so a slow response can't overwrite the current one.
      if ((err as Error)?.name !== 'AbortError') throw err;
    }
  };

  const previousLink = previousComponent ? {
    href: previousComponent ? componentRoute(previousComponent.id) : null,
    title: previousComponent ? previousComponent.title : null,
  } : null;
  const nextLink = nextComponent ? {
    href: componentRoute(nextComponent.id),
    title: nextComponent.title,
  } : null;

  useEffect(() => {
    const controller = new AbortController();
    setComponent(undefined);
    setPreviewsUnavailable(false);
    fetchComponents(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  if (previewsUnavailable) {
    return (
      <Layout config={config} menu={menu} current={current} metadata={metadata}>
        <div className="flex flex-col gap-3 pb-14">
          <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Components</small>
          <HeadersType.H1>{metadata.title}</HeadersType.H1>
          {metadata.description && (
            <div className="prose max-w-[800px] text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
              <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]}>
                {metadata.description}
              </ReactMarkdown>
            </div>
          )}
          <div className="mt-4 max-w-[800px] rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            This component has no published artifacts yet, so previews and code samples are unavailable. Publish it to the
            registry to populate its documentation.
          </div>
          <hr className="mt-8" />
          <PrevNextNav previous={previousLink} next={nextLink} />
        </div>
      </Layout>
    );
  }
  if (!component) {
    return (
      <Layout config={config} menu={menu} current={current} metadata={metadata}>
        <div className="flex flex-col gap-3 pb-14" aria-busy="true" aria-live="polite">
          <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Components</small>
          <HeadersType.H1>{metadata.title}</HeadersType.H1>
          {metadata.description && (
            <div className="prose max-w-[800px] text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
              <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]}>
                {metadata.description}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </Layout>
    );
  }
  const apiUrl = (window.location.origin && window.location.origin) + componentDataUrl;
  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-3 pb-14">
        <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Components</small>
        <a id="best-practices"></a>
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <div className="flex flex-row justify-between gap-4 md:flex-col">
          <div className="prose max-w-[800px] text-xl  font-light leading-relaxed text-gray-600 dark:text-gray-300">
            <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]}>
              {metadata.description}
            </ReactMarkdown>
          </div>
          <div className="flex flex-row gap-3">
            <RegistryActions mode={config.runtime.mode} connected={config.runtime.connected} entityType="component" id={id} />
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
                <div className="mx-5 w-full max-w-lg">
                  <DrawerHeader>
                    <DrawerTitle>API Response</DrawerTitle>
                    <p className="font-mono text-xs text-gray-500">{apiUrl}</p>
                  </DrawerHeader>
                  <div className="max-h-[80vh] w-full overflow-auto">
                    <JsonTreeView data={component} />
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
            <HotReloadProvider key={`hot-reload-${id}`} connect={componentHotReloadIsAvailable}>
              {componentPreviews.map(([title, cp], cpi) => (
                <React.Fragment key={`${id}-${cp.id}`}>
                  <PreviewContextProvider
                    key={`preview-context-${cp.id}`}
                    id={id}
                    defaultMetadata={metadata}
                    defaultMenu={menu}
                    defaultPreview={cp}
                    defaultConfig={config}
                  >
                    <ComponentPreview
                      key={`component-preview-${cp.id}`}
                      title={title}
                      bestPracticesCard={cpi === 0}
                      properties={cpi === componentPreviews.length - 1}
                      validations={cpi === componentPreviews.length - 1}
                    >
                      <p>Define a simple contact form</p>
                    </ComponentPreview>
                  </PreviewContextProvider>
                </React.Fragment>
              ))}
            </HotReloadProvider>
          ) : (
            <HotReloadProvider key={`hot-reload-${id}`} connect={componentHotReloadIsAvailable}>
              <PreviewContextProvider
                key={`preview-context-${id}`}
                id={id}
                defaultMetadata={metadata}
                defaultMenu={menu}
                defaultPreview={componentPreviews}
                defaultConfig={config}
              >
                <ComponentPreview key={`component-preview-${id}`} title={metadata.title} properties={true} validations={true}>
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
