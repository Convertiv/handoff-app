'use client';
import Link from 'next/link';
import { Monitor, Smartphone, SquareArrowOutUpRight, Tablet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Cards, { Card } from '../../../../components/Component/Cards';
import Layout from '../../../../components/Layout/Main';
import { MarkdownComponents } from '../../../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../../../components/Navigation/AnchorNav';
import PrevNextNav from '../../../../components/Navigation/PrevNextNav';
import { PatternPreviewObject } from '../../../../components/Pattern/types';
import HeadersType from '../../../../components/Typography/Headers';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../../../components/ui/drawer';
import { JsonTreeView } from '../../../../components/ui/json-tree-view';
import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { fetchPatterns, getClientRuntimeConfig, getCurrentSection, staticBuildMenu } from '../../../../components/util';

export async function getStaticPaths() {
  return {
    paths: fetchPatterns()?.map((p) => ({ params: { pattern: p.id } })) ?? [],
    fallback: false,
  };
}

export const getStaticProps = async (context: { params: { pattern: string } }) => {
  const { pattern } = context.params;
  const patterns = fetchPatterns()!;
  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();
  const metadata = patterns.find((p) => p.id === pattern);
  const sameGroupPatterns = patterns.filter((p) => p.group === metadata?.group);
  const groupIndex = sameGroupPatterns.findIndex((p) => p.id === pattern);
  const previousPattern = sameGroupPatterns[groupIndex - 1] ?? null;
  const nextPattern = sameGroupPatterns[groupIndex + 1] ?? null;

  return {
    props: {
      id: pattern,
      menu,
      config,
      current: getCurrentSection(menu, '/system') ?? [],
      metadata: {
        ...metadata,
        title: metadata?.name || metadata?.title,
        description: metadata?.description,
        image: 'hero-brand-assets',
      },
      previousPattern,
      nextPattern,
    },
  };
};

const PatternDetailPage = ({ menu, metadata, current, id, config, previousPattern, nextPattern }) => {
  const [pattern, setPattern] = useState<PatternPreviewObject>(undefined);
  const [selectedPreview, setSelectedPreview] = useState<string>('');
  const [width, setWidth] = useState<string>('1100px');
  const ref = React.useRef<HTMLDivElement>(null);

  const appBasePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const normalizedBasePath = appBasePath ? `/${appBasePath.replace(/^\/+|\/+$/g, '')}` : '';
  const patternRoute = (patternId: string) => `${normalizedBasePath}/system/pattern/${patternId}`;

  const fetchPatternData = async () => {
    try {
      const data = await fetch(`${normalizedBasePath}/api/pattern/${id}.json`).then((res) => res.json());
      setPattern(data as PatternPreviewObject);
      const previewKeys = Object.keys(data.previews || {});
      if (previewKeys.length > 0) {
        setSelectedPreview(previewKeys[0]);
      }
    } catch {
      setPattern(null);
    }
  };

  const previousLink = previousPattern
    ? { href: patternRoute(previousPattern.id), title: previousPattern.name || previousPattern.title }
    : null;
  const nextLink = nextPattern
    ? { href: patternRoute(nextPattern.id), title: nextPattern.name || nextPattern.title }
    : null;

  useEffect(() => {
    setPattern(undefined);
    fetchPatternData();
  }, [id]);

  if (!pattern) return <p>Loading...</p>;

  const apiUrl = (window.location.origin && window.location.origin) + `/api/pattern/${id}.json`;
  const previewKeys = Object.keys(pattern.previews || {});
  const currentPreview = pattern.previews?.[selectedPreview];
  const previewUrl = currentPreview?.url ? `${normalizedBasePath}/api/pattern/${currentPreview.url}` : '';

  const bestPracticesCards: Card[] = [];
  if (pattern.should_do && pattern.should_do.length > 0) {
    bestPracticesCards.push({ title: 'Best Practices', content: pattern.should_do.join('\n'), type: 'positive' });
  }
  if (pattern.should_not_do && pattern.should_not_do.length > 0) {
    bestPracticesCards.push({ title: 'Common Mistakes', content: pattern.should_not_do.join('\n'), type: 'negative' });
  }

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata}>
      <div className="flex flex-col gap-3 pb-14">
        <small className="text-sm font-medium text-sky-600 dark:text-gray-300">Patterns</small>
        <a id="best-practices"></a>
        <HeadersType.H1>{metadata.title || pattern.title}</HeadersType.H1>
        <div className="flex flex-row justify-between gap-4 md:flex-col">
          <div className="prose max-w-[800px] text-xl font-light leading-relaxed text-gray-600 dark:text-gray-300">
            <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
              {metadata.description || pattern.description}
            </ReactMarkdown>
          </div>
          <div className="flex flex-row gap-3">
            {pattern.figma && (
              <Button asChild variant={'outline'} size={'sm'} className="font-normal [&_svg]:size-3!">
                <a href={pattern.figma} target="_blank">
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
                    <JsonTreeView data={pattern} />
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
            <div className="rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 dark:border-gray-900 dark:bg-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <div className="flex items-center gap-2">
                  <HeadersType.H2 className="mb-0 text-base">Preview</HeadersType.H2>
                  {previewKeys.length > 0 && (
                    <Select value={selectedPreview} onValueChange={setSelectedPreview}>
                      <SelectTrigger className="h-8 w-[180px] border-none bg-white shadow-none dark:bg-gray-900">
                        <SelectValue placeholder="Select preview" />
                      </SelectTrigger>
                      <SelectContent>
                        {previewKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {pattern.previews[key].title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center gap-0">
                  <RadioGroup
                    className="flex items-center gap-0"
                    defaultValue="1100"
                    onValueChange={(value) => setWidth(`${value}px`)}
                  >
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-3 text-center text-xl ring-inset transition-colors hover:bg-gray-300 has-data-[state=checked]:bg-blue-50 has-data-[state=checked]:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 [&_svg]:size-3 dark:hover:bg-gray-600 dark:has-data-[state=checked]:bg-blue-950">
                            <RadioGroupItem value="1100" className="sr-only after:absolute after:inset-0" />
                            <Monitor />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Desktop (1100px)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-3 text-center text-xl transition-colors hover:bg-gray-300 has-data-[state=checked]:bg-blue-50 has-data-[state=checked]:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 [&_svg]:size-3 dark:hover:bg-gray-600 dark:has-data-[state=checked]:bg-blue-950">
                            <RadioGroupItem value="800" className="sr-only after:absolute after:inset-0" />
                            <Tablet />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Tablet (800px)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-3 text-center text-xl transition-colors hover:bg-gray-300 has-data-[state=checked]:bg-blue-50 has-data-[state=checked]:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 [&_svg]:size-2.5 dark:hover:bg-gray-600 dark:has-data-[state=checked]:bg-blue-950">
                            <RadioGroupItem value="400" className="sr-only after:absolute after:inset-0" />
                            <Smartphone />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Mobile (400px)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </RadioGroup>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="h-7 px-3 hover:bg-gray-300 [&_svg]:size-3 dark:hover:bg-gray-600"
                          variant="ghost"
                          onClick={() => {
                            if (currentPreview?.url && typeof window !== 'undefined') {
                              const base = (normalizedBasePath || '').replace(/\/+$/, '');
                              window.open(`${window.location.origin}${base}/api/pattern/${currentPreview.url}`, '_blank');
                            }
                          }}
                        >
                          <SquareArrowOutUpRight />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Open in New Tab</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            {previewUrl && (
              <div className="dotted-bg border border-t-0 rounded-b-lg overflow-hidden bg-white dark:bg-gray-950">
                <div className="p-4">
                  <iframe
                    src={previewUrl}
                    className="border-0 bg-white dark:bg-gray-900"
                    style={{
                      width: '100%',
                      maxWidth: width,
                      minHeight: '750px',
                      display: 'block',
                      margin: '0 auto',
                    }}
                    title={`${pattern.title} - ${currentPreview?.title || 'Preview'}`}
                  />
                </div>
              </div>
            )}
          </div>

          <a id="components"></a>
          <div className="mb-8">
            <HeadersType.H2 className="mb-4">Components</HeadersType.H2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This pattern is composed of the following components in order:
            </p>
            <div className="flex flex-col gap-2">
              {(pattern.components || []).map((componentId, index) => (
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

export default PatternDetailPage;
