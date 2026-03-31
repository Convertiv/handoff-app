'use client';
import { PatternListObject } from '@handoff/transformers/preview/types';
import { startCase } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import PrevNextNav from '../../../../components/Navigation/PrevNextNav';
import HeadersType from '../../../../components/Typography/Headers';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/accordion';
import { Badge } from '../../../../components/ui/badge';
import { JsonTreeView } from '../../../../components/ui/json-tree-view';
import {
  DocumentationProps,
  fetchPatterns,
  getClientRuntimeConfig,
  getCurrentSection,
  IParams,
  staticBuildMenu,
} from '../../../../components/util';

type PatternNavItem = { id: string; title: string; description: string; group: string };

interface PatternPageProps extends DocumentationProps {
  id: string;
  previousPattern: PatternNavItem | null;
  nextPattern: PatternNavItem | null;
}

const SYNTHETIC_PATTERN_PREVIEW_PREFIX = '__pattern_';

const isSyntheticPatternPreview = (previewKey?: string) => Boolean(previewKey?.startsWith(SYNTHETIC_PATTERN_PREVIEW_PREFIX));

const formatPreviewLabel = (component: PatternListObject['components'][number], index: number) => {
  const previewKey = component.preview || component.resolvedPreview;

  if (!previewKey) {
    return {
      title: 'Default preview',
      subtitle: 'Uses the component default preview configuration.',
      rawKey: null,
    };
  }

  if (isSyntheticPatternPreview(previewKey)) {
    return {
      title: component.args ? 'Custom configuration' : `Generated preview ${index + 1}`,
      subtitle: component.args ? 'Built from inline args for this pattern.' : 'Generated specifically for this pattern composition.',
      rawKey: previewKey,
    };
  }

  return {
    title: startCase(previewKey),
    subtitle: 'Named preview from the component docs.',
    rawKey: previewKey,
  };
};

const formatArgValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value.length > 24 ? `${value.slice(0, 21)}...` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }

  if (value && typeof value === 'object') {
    return `${Object.keys(value as Record<string, unknown>).length} fields`;
  }

  if (value === null) {
    return 'null';
  }

  return 'set';
};

const getArgSummary = (args?: Record<string, unknown>) => {
  if (!args) return [];

  return Object.entries(args).slice(0, 3);
};

export async function getStaticPaths() {
  return {
    paths: fetchPatterns()?.map((p) => ({ params: { pattern: p.id } })) ?? [],
    fallback: false,
  };
}

export const getStaticProps = async (context: { params: IParams }) => {
  const { pattern: patternId } = context.params;
  const patterns = fetchPatterns() ?? [];
  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();
  const patternData = patterns.find((p) => p.id === patternId);

  const sameGroupPatterns = patterns.filter((p) => p.group === patternData?.group);
  const groupIndex = sameGroupPatterns.findIndex((p) => p.id === patternId);
  const previousPattern = sameGroupPatterns[groupIndex - 1] ?? null;
  const nextPattern = sameGroupPatterns[groupIndex + 1] ?? null;

  const fallbackTitle = patternData?.title || startCase(patternId as string);

  return {
    props: {
      id: patternId,
      menu,
      config,
      current: getCurrentSection(menu, '/system') ?? [],
      metadata: {
        title: fallbackTitle,
        description: patternData?.description || '',
        metaTitle: `${fallbackTitle}${config?.app?.client ? ` | ${config.app.client} Design System` : ''}`,
        metaDescription: patternData?.description || '',
      },
      previousPattern,
      nextPattern,
    },
  };
};

const PatternPage = ({ menu, metadata, current, id, config, previousPattern, nextPattern }: PatternPageProps) => {
  const [pattern, setPattern] = useState<PatternListObject | undefined>(undefined);
  const [fetchError, setFetchError] = useState<string | undefined>(undefined);
  const [iframeHeight, setIframeHeight] = useState('400px');
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const appBasePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const normalizedBasePath = appBasePath ? `/${appBasePath.replace(/^\/+|\/+$/g, '')}` : '';
  const patternRoute = (patternId: string) => `${normalizedBasePath}/system/pattern/${patternId}`;

  const previousLink = previousPattern ? { href: patternRoute(previousPattern.id), title: previousPattern.title } : null;
  const nextLink = nextPattern ? { href: patternRoute(nextPattern.id), title: nextPattern.title } : null;
  const invalidComponents = pattern?.components?.filter((comp) => comp.resolved === false) ?? [];

  useEffect(() => {
    const controller = new AbortController();
    setPattern(undefined);
    setFetchError(undefined);

    fetch(`${normalizedBasePath}/api/pattern/${id}.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load pattern: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => setPattern(data as PatternListObject))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setFetchError(err instanceof Error ? err.message : 'Failed to load pattern data.');
        }
      });

    return () => controller.abort();
  }, [id, normalizedBasePath]);

  const onIframeLoad = useCallback(() => {
    if (iframeRef.current?.contentWindow?.document?.body) {
      setIframeHeight(iframeRef.current.contentWindow.document.body.scrollHeight + 'px');
    }
  }, []);

  if (fetchError) return <p className="p-4 text-red-500">{fetchError}</p>;
  if (!pattern) return <p>Loading...</p>;

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-3 pb-14">
        <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Patterns</small>
        <div className="flex flex-wrap items-center gap-3">
          <HeadersType.H1>{metadata.title}</HeadersType.H1>
          <Badge
            variant="outline"
            className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            {pattern.components?.length ?? 0} component{(pattern.components?.length ?? 0) === 1 ? '' : 's'}
          </Badge>
        </div>
        {metadata.description && (
          <div className="prose max-w-[800px] text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {metadata.description}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="max-w-[1100px]">
        {invalidComponents.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {invalidComponents.length} pattern component{invalidComponents.length > 1 ? 's could' : ' could'} not be resolved and{' '}
            {invalidComponents.length > 1 ? 'were' : 'was'} skipped.
          </div>
        )}

        {/* Full-page pattern preview */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-900">
          <div className="flex w-full items-center justify-between rounded-t-lg bg-gray-50 px-6 py-2 dark:bg-gray-800">
            <p className="font-monospace text-[11px] text-accent-foreground">Pattern Preview</p>
          </div>
          <div className="dotted-bg w-full p-4">
            {pattern.url ? (
              <iframe
                ref={iframeRef}
                onLoad={onIframeLoad}
                height={iframeHeight}
                style={{
                  width: '100%',
                  height: iframeHeight,
                  display: 'block',
                  border: 'none',
                }}
                src={`${normalizedBasePath}/api/pattern/${pattern.url}`}
              />
            ) : (
              <div className="flex items-center justify-center p-8 text-sm text-gray-500">No preview available for this pattern.</div>
            )}
          </div>
        </div>

        {/* Component list */}
        {pattern.components && pattern.components.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <HeadersType.H3>Components in this pattern</HeadersType.H3>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              {pattern.components.map((comp, i) => {
                const previewMeta = formatPreviewLabel(comp, i);
                const argSummary = getArgSummary(comp.args);
                const hasArgs = Boolean(comp.args);

                return (
                  <div
                    key={`${comp.id}-${i}`}
                    className="border-b border-gray-200 bg-white last:border-b-0 dark:border-gray-800 dark:bg-transparent"
                  >
                    <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:px-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{String(i + 1).padStart(2, '0')}</span>
                        <code className="font-mono text-[13px] text-gray-900 dark:text-gray-100">{comp.id}</code>
                        {comp.resolved === false && (
                          <Badge variant="warning" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                            Unresolved
                          </Badge>
                        )}
                      </div>

                      <div className="min-w-0">
                        {comp.resolved === false ? (
                          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            Could not resolve component preview.
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">
                                  Preview
                                </p>
                                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{previewMeta.title}</p>
                              </div>

                              {previewMeta.rawKey && !hasArgs && (
                                <div className="inline-flex max-w-full items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 dark:bg-gray-900">
                                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                                    Key
                                  </span>
                                  <code className="truncate font-mono text-xs text-gray-500 dark:text-gray-400">{previewMeta.rawKey}</code>
                                </div>
                              )}
                            </div>

                            {hasArgs ? (
                              <div className="mt-2">
                                <Accordion type="single" collapsible className="mt-1">
                                  <AccordionItem value={`args-${i}`} className="border-none">
                                    <div className="flex flex-wrap gap-2">
                                      {argSummary.length > 0 && (
                                        <dl className="flex flex-wrap gap-2">
                                          {argSummary.map(([key, value]) => (
                                            <div
                                              key={key}
                                              className="inline-flex max-w-full items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 dark:bg-gray-900"
                                            >
                                              <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                                                {key}
                                              </dt>
                                              <dd className="truncate text-xs text-gray-900 dark:text-gray-100">{formatArgValue(value)}</dd>
                                            </div>
                                          ))}
                                          {Object.keys(comp.args ?? {}).length > argSummary.length && (
                                            <div className="inline-flex max-w-full items-center rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                              +{Object.keys(comp.args ?? {}).length - argSummary.length} more
                                            </div>
                                          )}
                                        </dl>
                                      )}

                                      <AccordionTrigger className="inline-flex w-auto flex-none items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 no-underline hover:bg-gray-100 hover:text-gray-600 hover:no-underline dark:bg-gray-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 [&>svg]:h-3.5 [&>svg]:w-3.5">
                                        All args
                                      </AccordionTrigger>
                                    </div>
                                    <AccordionContent className="pt-2">
                                      <JsonTreeView
                                        data={comp.args}
                                        defaultExpanded
                                        maxInitialDepth={1}
                                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
                                      />
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            ) : (
                              <></>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <hr className="mt-8" />
        <PrevNextNav previous={previousLink} next={nextLink} />
      </div>
    </Layout>
  );
};

export default PatternPage;
