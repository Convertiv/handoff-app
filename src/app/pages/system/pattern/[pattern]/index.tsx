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

  const previousLink = previousPattern
    ? { href: patternRoute(previousPattern.id), title: previousPattern.title }
    : null;
  const nextLink = nextPattern
    ? { href: patternRoute(nextPattern.id), title: nextPattern.title }
    : null;
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
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        {metadata.description && (
          <div className="prose max-w-[800px] text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {metadata.description}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="max-w-[1100px]">
        {/* Pattern composition info */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <span>{pattern.components?.length ?? 0} component(s)</span>
          {pattern.group && (
            <>
              <span className="text-gray-300">|</span>
              <span>{pattern.group}</span>
            </>
          )}
        </div>

        {invalidComponents.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {invalidComponents.length} pattern component{invalidComponents.length > 1 ? 's could' : ' could'} not be resolved and {invalidComponents.length > 1 ? 'were' : 'was'} skipped.
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
              <div className="flex items-center justify-center p-8 text-sm text-gray-500">
                No preview available for this pattern.
              </div>
            )}
          </div>
        </div>

        {/* Component list */}
        {pattern.components && pattern.components.length > 0 && (
          <div className="mt-8">
            <HeadersType.H3>Components in this pattern</HeadersType.H3>
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Component</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Preview</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Custom Args</th>
                  </tr>
                </thead>
                <tbody>
                  {pattern.components.map((comp, i) => (
                    <tr key={`${comp.id}-${i}`} className="border-b last:border-b-0 dark:border-gray-800">
                      <td className="px-4 py-2 font-mono text-xs">{comp.id}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {comp.preview || comp.resolvedPreview || 'default'}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {comp.resolved === false ? (
                          <span className="inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                            Unresolved
                          </span>
                        ) : (
                          <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {comp.args ? JSON.stringify(comp.args) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
