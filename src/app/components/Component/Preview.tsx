import { buildArtifactUrl } from '@handoff/artifacts/url';
import { SlotMetadata } from '@handoff/transformers/preview/component';
import { PageSlice, PreviewWidth } from '@handoff/transformers/preview/types';
import { PreviewObject } from '@handoff/types/preview';
import { Types as CoreTypes } from 'handoff-core';
import type { TypeNode, TypeNodeProperty } from 'handoff-docgen';
import { startCase } from 'lodash';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Component,
  File,
  Maximize2,
  Minimize2,
  Monitor,
  MousePointerClick,
  RefreshCcw,
  Smartphone,
  SquareArrowOutUpRight,
  Tablet,
  Text,
} from 'lucide-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { HotReloadContext } from '../context/HotReloadProvider';
import { usePreviewContext } from '../context/PreviewContext';
import RulesSheet from '../Foundations/RulesSheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import PageSliceResolver from './PageSliceResolver';

/** A preview without a url has no built artifact, so it can never be shown. */
const getRenderablePreviewKeys = (previews: PreviewObject['previews'] | undefined): string[] =>
  Object.entries(previews ?? {})
    .filter(([, preview]) => preview.url)
    .map(([key]) => key);

/** A frame longer than the card's duration-300 class, so the card rejoins the flow once it lands. */
const COLLAPSE_MS = 340;

/**
 * Where the card is between the flow and the floating view.
 *
 * `entering` and `leaving` hold it at the rect it occupies in the flow, and only `full` and
 * `leaving` transition. The geometry must never animate across the change of positioning scheme:
 * `w-full` and the inline width are both percentages, of the viewport while fixed and of the
 * column while static. The browser interpolates between the two, and the card jumps to the wrong
 * width before it grows back.
 */
type ExpandPhase = 'collapsed' | 'entering' | 'full' | 'leaving';

/** defaultHeight is hand-authored, and the stage scales it with calc(), which rejects bare numbers. */
const toCssLength = (value: string): string => (/^\d+(\.\d+)?$/.test(value) ? `${value}px` : value);

/** The inspect artifact sits beside the preview artifact under a fixed suffix. */
const toArtifactPath = (url: string, inspect: boolean): string => (inspect ? `${url.split('.html')[0]}-inspect.html` : url);

const getDefaultSlices = (): PageSlice[] => [
  { type: 'BEST_PRACTICES' },
  { type: 'COMPONENT_DISPLAY' },
  { type: 'VALIDATION_RESULTS' },
  { type: 'PROPERTIES' },
];

export type ComponentPreview = {
  component: CoreTypes.IComponentInstance;
  name: string;
  overrides?: { states?: string[] | undefined };
};

export type ComponentPreviews = ComponentPreview[];

export const getComponentPreviewTitle = (previewableComponent: ComponentPreview): string => {
  return previewableComponent.name ? `${previewableComponent.name}` : `${startCase(previewableComponent.component.name)}`;
};

export const ComponentDisplay: React.FC<{
  component: PreviewObject | undefined;
  defaultHeight?: string | undefined;
  defaultWidth?: PreviewWidth | undefined;
  title?: string;
  onPreviewChange?: (previewUrl: string) => void;
}> = ({ component, defaultHeight, defaultWidth, title, onPreviewChange }) => {
  const context = usePreviewContext();
  const ref = React.useRef<HTMLIFrameElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const collapseTimer = React.useRef<number | undefined>(undefined);
  const contentObserver = React.useRef<ResizeObserver | null>(null);
  const stageObserver = React.useRef<ResizeObserver | null>(null);
  const [height, setHeight] = React.useState('100px');
  const [previewKey, setPreviewKey] = React.useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = React.useState<PreviewWidth>(defaultWidth ?? 'fluid');
  const [stageWidth, setStageWidth] = React.useState(0);
  const [inspect, setInspect] = React.useState(false);
  const [phase, setPhase] = React.useState<ExpandPhase>('collapsed');
  // top/left/width are percentages of the viewport, the same units the expanded card uses. A
  // transition between a pixel value and a vw has nothing reliable to interpolate.
  const [originRect, setOriginRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const expanded = phase !== 'collapsed';
  const animates = phase === 'full' || phase === 'leaving';

  const renderablePreviewKeys = getRenderablePreviewKeys(component?.previews);
  const selectedPreview = previewKey ? component?.previews?.[previewKey] : undefined;
  const artifactPath = selectedPreview?.url ? toArtifactPath(selectedPreview.url, inspect) : null;

  // A fluid preview takes the width the stage has, so it renders at 100% and shows the layout the
  // reader would really get at that width. A fixed width is only scaled when it does not fit, and
  // never scaled up: a component shown larger than it renders misrepresents the design system.
  const renderWidth = previewWidth === 'fluid' ? stageWidth : previewWidth;
  const scale = renderWidth > stageWidth ? stageWidth / renderWidth : 1;

  // Expanding lifts the card out of the flow rather than moving it into a dialog. Moving it would
  // remount the iframe, and the preview would reload behind the animation instead of growing with
  // it. The card starts at the rect it already occupies, so the first frame looks identical.
  const expand = () => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    window.clearTimeout(collapseTimer.current);
    setOriginRect({
      top: (rect.top / window.innerHeight) * 100,
      left: (rect.left / window.innerWidth) * 100,
      width: (rect.width / window.innerWidth) * 100,
      height: rect.height,
    });
    setPhase('entering');
    requestAnimationFrame(() => setPhase('full'));
  };

  // A timer, not transitionend: reduced motion removes the transition, and then the event that
  // would put the card back in the flow never fires.
  const collapse = () => {
    setPhase('leaving');
    window.clearTimeout(collapseTimer.current);
    collapseTimer.current = window.setTimeout(() => setPhase('collapsed'), COLLAPSE_MS);
  };

  React.useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    const pageOverflow = document.body.style.overflow;

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = pageOverflow;
    };
  }, [expanded]);

  // A fluid preview already follows the stage, so animating its width only lags behind a resize.
  // No easing while the card moves: the target changes every frame, so each frame would restart a
  // 0.2s ease and the stage would trail the preview inside it. The ease is for discrete changes -
  // a new device width, a new variant.
  const boxTransition = animates
    ? 'none'
    : previewWidth === 'fluid'
      ? 'height 0.2s ease-in-out'
      : 'width 0.2s ease-in-out, height 0.2s ease-in-out';

  // A ref callback, not an effect: the stage only exists once a preview is available. A hidden tab
  // never delivers a ResizeObserver entry, so the first width is read directly.
  const observeStage = useCallback((stage: HTMLDivElement | null) => {
    stageObserver.current?.disconnect();
    if (!stage) return;
    setStageWidth(stage.clientWidth);
    stageObserver.current = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    stageObserver.current.observe(stage);
  }, []);

  // Generate variants from component previews only for Figma atomic components
  const localVariants = React.useMemo(() => {
    if (!component?.figmaComponentId || !component?.previews) return null;

    // Check if component previews are different from context previews
    const componentPreviewKeys = Object.keys(component.previews).sort();
    const contextPreviewKeys = context.preview ? Object.keys(context.preview.previews).sort() : [];

    if (JSON.stringify(componentPreviewKeys) !== JSON.stringify(contextPreviewKeys)) {
      // Generate variants from component previews
      const variantMap: Record<string, Set<string>> = {};
      Object.values(component.previews).forEach((preview: any) => {
        Object.entries(preview.values).forEach(([key, value]) => {
          const strValue = String(value);
          if (!strValue) return;
          if (!variantMap[key]) {
            variantMap[key] = new Set();
          }
          variantMap[key].add(strValue);
        });
      });

      return Object.fromEntries(Object.entries(variantMap).map(([key, values]) => [key, Array.from(values)]));
    }

    return context.variants;
  }, [component?.figmaComponentId, component?.previews, context.preview, context.variants]);

  // The stage reserves the scaled height, so it needs the live content height. That height changes
  // whenever the preview reflows - a new device width, a late font, an image - not only on load.
  const onLoad = useCallback(() => {
    contentObserver.current?.disconnect();

    if (defaultHeight) {
      setHeight(toCssLength(defaultHeight));
      return;
    }

    const body = ref.current?.contentWindow?.document?.body;
    if (!body) return;

    const measure = () => setHeight(body.scrollHeight + 'px');
    measure();
    contentObserver.current = new ResizeObserver(measure);
    contentObserver.current.observe(body);
  }, [defaultHeight]);

  React.useEffect(() => {
    onLoad();
  }, [onLoad]);

  React.useEffect(() => {
    setPreviewWidth(defaultWidth ?? 'fluid');
  }, [defaultWidth]);

  React.useEffect(
    () => () => {
      contentObserver.current?.disconnect();
      stageObserver.current?.disconnect();
      window.clearTimeout(collapseTimer.current);
    },
    []
  );

  // One effect owns the selection. Split in two, the filter effect clears the selection, then
  // returns early on the next render and never restores it.
  React.useEffect(() => {
    const keys = getRenderablePreviewKeys(component?.previews);

    if (!context.variantFilter) {
      setPreviewKey(keys[0] ?? null);
      return;
    }

    const match = keys.find((key) =>
      Object.entries(context.variantFilter).every(([property, value]) => component.previews[key].values[property] === value)
    );

    setPreviewKey(match ?? null);
  }, [context.variantFilter, component]);

  React.useEffect(() => {
    // The plain url identifies the preview downstream, so inspect mode must not change it.
    if (!selectedPreview?.url) return;
    !!onPreviewChange && onPreviewChange(selectedPreview.url);
  }, [onPreviewChange, selectedPreview?.url]);

  const { reloadCounter } = useContext(HotReloadContext);

  // Helper to check if an option is valid given other current selections
  const isOptionValid = (property: string, value: string) => {
    if (!component?.previews || !context.variantFilter) return true;

    // Create a filter that includes the potential new value for this property
    // AND keeps the current values for all OTHER properties
    const testFilter = { ...context.variantFilter, [property]: value };

    // Check if ANY preview matches this combination
    return Object.values(component.previews).some((preview: any) =>
      Object.entries(testFilter).every(([key, val]) => preview.values[key] === val)
    );
  };

  const collapsedStyle: React.CSSProperties = { position: 'fixed', zIndex: 50 };
  const originStyle: React.CSSProperties = originRect
    ? { top: `${originRect.top}%`, left: `${originRect.left}%`, width: `${originRect.width}%`, transform: 'translateY(0)' }
    : {};
  // Positioned against the viewport, so it subtracts the assistant's column itself. The margin is a
  // share of what is left, not of the whole viewport, so the card stays centered in usable space.
  const freeWidth = 'calc(100vw - var(--ai-dock-width, 0px))';
  const fullSizeStyle: React.CSSProperties = {
    ...collapsedStyle,
    top: '50%',
    left: `calc(${freeWidth} * 0.02)`,
    width: `calc(${freeWidth} * 0.96)`,
    maxHeight: '92vh',
    transform: 'translateY(-50%)',
  };

  const card = (
    <div
      ref={cardRef}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? `${title ?? 'Component'} preview` : undefined}
      style={expanded ? (phase === 'full' ? fullSizeStyle : { ...collapsedStyle, ...originStyle }) : undefined}
      className={`text-medium flex w-full flex-col items-center rounded-lg border border-gray-200 dark:border-gray-900 ${
        expanded ? 'overflow-hidden bg-background shadow-xl' : ''
      } ${animates ? 'transition-[top,left,width,transform] duration-300 ease-out motion-reduce:transition-none' : ''}`}
    >
      {component?.previews && (
        <>
          <div
            className="flex w-full items-center justify-between rounded-t-lg bg-gray-50 px-6 py-2 pr-3 align-middle @container dark:bg-gray-800"
          >
            <div className="flex flex-1 items-start gap-2">
              {localVariants ? (
                <>
                  {Object.keys(localVariants).length > 0 && (
                    <>
                      <div className="flex h-8 shrink-0 items-center gap-2">
                        <p className="font-monospace text-[11px] text-accent-foreground">{title ?? 'Variant'}</p>
                        <Separator orientation="vertical" className="h-3" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(localVariants)
                          .filter((variantProperty) => localVariants[variantProperty].length > 1)
                          .map((variantProperty) => (
                            <Select
                              key={variantProperty}
                              value={context.variantFilter ? context.variantFilter[variantProperty] : undefined}
                              onValueChange={(value) => context.updateVariantFilter(variantProperty, value)}
                            >
                              <SelectTrigger className="h-8 w-[140px] border-none text-xs shadow-none">
                                <SelectValue placeholder={variantProperty} />
                              </SelectTrigger>
                              <SelectContent>
                                {localVariants[variantProperty].map((variantPropertyValue) => {
                                  if (typeof variantPropertyValue !== 'string' || variantPropertyValue === '') return null;
                                  return (
                                    <SelectItem
                                      key={variantPropertyValue}
                                      value={variantPropertyValue}
                                      disabled={!isOptionValid(variantProperty, variantPropertyValue)}
                                    >
                                      {variantPropertyValue}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Select value={previewKey ?? ''} onValueChange={setPreviewKey}>
                    <SelectTrigger className="h-8 w-[180px] border-none border-gray-200 bg-white text-xs shadow-none dark:border-gray-900">
                      <SelectValue placeholder="Preview" />
                    </SelectTrigger>
                    <SelectContent>
                      {renderablePreviewKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {component.previews[key].title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            <div className="hidden items-center gap-0 @xl:flex">
              {scale < 1 && (
                <>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="px-3 font-mono text-[11px] text-gray-500">{Math.round(scale * 100)}%</span>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">
                        Too wide for this column. Expand to see it at full size.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Separator orientation="vertical" className="mx-3 h-6" />
                </>
              )}
              <RadioGroup
                className="flex items-center gap-0"
                value={String(previewWidth)}
                onValueChange={(value) => setPreviewWidth(value === 'fluid' ? 'fluid' : Number(value))}
              >
                <label className="relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-3 text-center text-xl ring-inset transition-colors hover:bg-gray-300 has-data-disabled:cursor-not-allowed has-data-[state=checked]:bg-blue-50 has-data-disabled:opacity-50 has-data-[state=checked]:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] has-focus-visible:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-ring/70 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 [&_svg]:size-3">
                  <RadioGroupItem value="fluid" aria-label="Fill the available width" className="sr-only after:absolute after:inset-0" />
                  <Monitor />
                </label>
                <label className="relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-3 text-center text-xl transition-colors hover:bg-gray-300 has-data-disabled:cursor-not-allowed has-data-[state=checked]:bg-blue-50 has-data-disabled:opacity-50 has-data-[state=checked]:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] has-focus-visible:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-ring/70 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 [&_svg]:size-3">
                  <RadioGroupItem value="800" aria-label="Tablet width, 800px" className="sr-only after:absolute after:inset-0" />
                  <Tablet />
                </label>
                <label className="relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-3 text-center text-xl transition-colors hover:bg-gray-300 has-data-disabled:cursor-not-allowed has-data-[state=checked]:bg-blue-50 has-data-disabled:opacity-50 has-data-[state=checked]:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.05)] has-focus-visible:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-ring/70 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 [&_svg]:size-2.5">
                  <RadioGroupItem value="400" aria-label="Mobile width, 400px" className="sr-only after:absolute after:inset-0" />
                  <Smartphone />
                </label>
              </RadioGroup>
              <Separator orientation="vertical" className="mx-3 h-6" />
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-7 px-3 hover:bg-gray-300 [&_svg]:size-3"
                      onClick={() => {
                        if (ref.current) {
                          ref.current.contentWindow.location.reload();
                        }
                      }}
                      variant="ghost"
                    >
                      <RefreshCcw />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Refresh Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-7 px-3 hover:bg-gray-300 [&_svg]:size-4"
                      onClick={() => {
                        setInspect(!inspect);
                      }}
                      variant={inspect ? 'default' : 'ghost'}
                    >
                      <MousePointerClick strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Inspect Component</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={expanded ? 'Collapse preview' : 'Expand preview'}
                      className="h-7 px-3 hover:bg-gray-300 [&_svg]:size-3"
                      onClick={() => (expanded ? collapse() : expand())}
                      variant="ghost"
                    >
                      {expanded ? <Minimize2 /> : <Maximize2 />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">
                    {expanded ? 'Collapse Preview' : 'Expand Preview'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-7 px-3 hover:bg-gray-300 [&_svg]:size-3"
                      onClick={() => {
                        // open in new tab
                        window.open(buildArtifactUrl(`component/${artifactPath}`, process.env.HANDOFF_APP_BASE_PATH ?? ''), '_blank');
                      }}
                      variant="ghost"
                    >
                      <SquareArrowOutUpRight />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Open in New Tab</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className={`dotted-bg w-full p-4 ${expanded ? 'min-h-0' : ''}`}>
            {artifactPath ? (
              // The outer div measures the width available to the preview. The inner one carries
              // the scaled size, because a transform does not shrink the layout box: without it
              // the stage keeps the unscaled box and pads the preview with dead space on the
              // right and below.
              <div ref={observeStage}>
                {renderWidth > 0 && (
                  <div
                    style={{
                      width: renderWidth * scale,
                      height: `calc(${height} * ${scale})`,
                      margin: '0 auto',
                      transition: boxTransition,
                    }}
                  >
                    <iframe
                      key={`${artifactPath}-${reloadCounter}`}
                      onLoad={onLoad}
                      ref={ref}
                      style={{
                        width: renderWidth,
                        height: height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'left top',
                        transition: animates ? 'none' : 'transform 0.2s ease-in-out',
                        display: 'block',
                      }}
                      src={buildArtifactUrl(`component/${artifactPath}`, process.env.HANDOFF_APP_BASE_PATH ?? '')}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-sm text-gray-500">
                No preview available for this selection.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // The docs column is narrower than the widths most components are designed for. Expanding is
  // how a reader gets the real layout at 100% instead of a scaled copy of it. The placeholder holds
  // the page height while the card floats, so nothing behind the overlay jumps.
  return (
    <>
      {expanded && (
        <div
          className={`backdrop-blur-xs fixed inset-0 z-40 bg-gray-200/50 transition-opacity duration-300 dark:bg-gray-950/60 ${
            phase === 'full' ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={collapse}
        />
      )}
      <div className="md:flex" id="preview" style={expanded && originRect ? { minHeight: originRect.height } : undefined}>
        {card}
      </div>
    </>
  );
};

export const ComponentPreview: React.FC<{
  defaultPreview?: PreviewObject;
  code?: string;
  title: string;
  children: React.ReactNode;
  height?: string;
  bestPracticesCard?: boolean;
  codeHighlight?: boolean;
  properties?: boolean;
  validations?: boolean;
}> = ({
  defaultPreview,
  title,
  children,
  height,
  bestPracticesCard = true,
  codeHighlight = true,
  properties = true,
  validations = true,
}) => {
    const context = usePreviewContext();
    const [loaded, setLoaded] = React.useState(false);
    const [preview, setPreview] = React.useState<PreviewObject | undefined>(defaultPreview);
    const [currentPreviewUrl, setCurrentPreviewUrl] = React.useState<string | undefined>();
    React.useEffect(() => {
      if (context.preview) {
        setPreview(context.preview);
        setLoaded(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded, setLoaded, context.preview]);

    useEffect(() => {
      setPreview(defaultPreview);
    }, [defaultPreview]);

    if (!preview) {
      return <div>No preview available</div>;
    }
    if (!loaded) {
      return <div id={preview.id}>Loading Previews</div>;
    }

    // Determine which slices to use: custom slices or default slices
    const slicesToRender =
      preview.page && Array.isArray(preview.page.slices) && preview.page.slices.length > 0 ? preview.page.slices : getDefaultSlices();

    return (
      <>
        {slicesToRender.map((slice, idx) => (
          <PageSliceResolver
            key={idx}
            slice={slice}
            preview={preview}
            title={title}
            height={height}
            currentPreviewUrl={currentPreviewUrl}
            onPreviewChange={(previewUrl) => {
              setCurrentPreviewUrl(previewUrl);
            }}
            bestPracticesCard={bestPracticesCard}
            codeHighlight={codeHighlight}
            properties={properties}
            validations={validations}
          />
        ))}
        <hr />
      </>
    );
  };

export const ComponentProperties: React.FC<{ fields: SlotMetadata[] }> = ({ fields }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedField, setSelectedField] = React.useState(null);
  const openSheet = (field) => {
    setSelectedField(field);
    setOpen(true);
  };
  const openFromHash = () => {
    if (window.location.hash) {
      const field = fields.find((field) => field.key === window.location.hash.replace('#', ''));
      if (field) {
        setSelectedField(field);
        setOpen(true);
      }
    }
  };
  useEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }, [fields]);
  return (
    <>
      <RulesSheet open={open} setOpen={setOpen} field={selectedField} />
      <p className="mb-5">These are the properties associated with the component.</p>
      <Table className="table-fixed">
        <TableHeader className="border-b-0 border-l-[0.5px] border-r-[0.5px] border-t-[0.5px] bg-gray-50/80 dark:bg-gray-800/80 ">
          <TableRow className="border-b-[0.5px]!">
            <TableHead className="w-[22%] border-r-[0.5px] px-4 text-xs font-medium text-gray-900 dark:text-gray-100">
              <Component className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Name
            </TableHead>
            <TableHead className="w-[13rem] border-r-[0.5px] px-4 text-xs font-medium text-gray-900 dark:text-gray-100">
              <File className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Type
            </TableHead>
            <TableHead className="w-[10rem] border-r-[0.5px] px-4 text-xs font-medium text-gray-900 dark:text-gray-100">
              <CircleCheck className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Required
            </TableHead>
            <TableHead className="border-r-[0.5px] px-4 text-xs font-medium text-gray-900 dark:text-gray-100">
              <Text className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Default / Description
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length > 0 ? (
            <TableRows rows={fields} openSheet={openSheet} />
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No properties have been documented for this component yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

export const getVariantForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'text':
      return 'green';
    case 'image':
      return 'info';
    case 'video_file':
    case 'video_embed':
      return 'warning';
    default:
      return 'default';
  }
};

const getTypeLabel = (field: SlotMetadata): string => field.deepType?.display || field.docgenType || field.generic || field.type || 'unknown';

const summarizeTypeLabel = (typeLabel: string): string => {
  if (!typeLabel || typeLabel.length <= 46) {
    return typeLabel;
  }

  const parts = typeLabel
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 2) {
    const isNullable = parts.some((part) => part === 'undefined' || part === 'null');
    const concreteParts = parts.filter((part) => part !== 'undefined' && part !== 'null');

    if (concreteParts.length > 2) {
      return `${concreteParts.slice(0, 2).join(' | ')} +${concreteParts.length - 2}${isNullable ? ' | undefined' : ''}`;
    }
  }

  return `${typeLabel.slice(0, 43)}...`;
};

const formatInlineValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatDefaultValue = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatInlineValue(item)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    return entries.map(([key, val]) => `${key}: ${formatInlineValue(val)}`).join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const TableRows: React.FC<{
  rows: SlotMetadata[];
  openSheet: (field: SlotMetadata) => void;
}> = ({
  rows,
  openSheet,
}) => {
    return (
      <>
        {rows.map((row, i) => {
          if (!row) return null;
          const currentPath = row.key || row.name || String(i);
          return <ExpandableTableRow key={`row-${currentPath}-${i}`} row={row} openSheet={openSheet} />;
        })}
      </>
    );
  };

const AnnotationList: React.FC<{ annotations?: { name: string; text?: string }[] }> = ({ annotations }) => {
  if (!annotations?.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {annotations.map((annotation, idx) => (
        <Badge
          key={`${annotation.name}-${idx}`}
          variant="outline"
          className="rounded-xl border-violet-300 bg-violet-50 px-2 text-[10px] text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
        >
          @{annotation.name}
          {annotation.text ? `: ${annotation.text}` : ''}
        </Badge>
      ))}
    </div>
  );
};

const TypeNodePropertyView: React.FC<{ property: TypeNodeProperty; depth: number }> = ({ property, depth }) => {
  return (
    <div className="mt-3 rounded-md border border-gray-200/90 bg-white/80 p-3 dark:border-gray-800 dark:bg-gray-900/20">
      <div className="flex items-center gap-2">
        <p className="font-mono text-xs">
          {property.name}
          {property.optional ? '?' : ''}
        </p>
        {property.optional ? (
          <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
            optional
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{property.type.display}</p>
      {property.description ? (
        <p className="mt-1.5 text-[11px] leading-normal text-muted-foreground/90">{property.description}</p>
      ) : null}
      <AnnotationList annotations={property.annotations} />
      <TypeNodeTree node={property.type} depth={depth + 1} />
    </div>
  );
};

const TypeNodeTree: React.FC<{ node?: TypeNode; depth?: number }> = ({ node, depth = 0 }) => {
  if (!node) {
    return null;
  }

  const indentClass = depth > 0 ? 'ml-4 border-l border-dashed border-gray-300 pl-3 dark:border-gray-700' : '';

  return (
    <div className={`mt-2 ${indentClass}`}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-200/80 bg-gray-50/60 px-2 py-1.5 text-xs dark:border-gray-800 dark:bg-gray-800/25">
        <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
          {node.kind}
        </Badge>
        <span className="font-mono">{node.display}</span>
        {node.truncated ? (
          <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
            truncated
          </Badge>
        ) : null}
        {node.cycleDetected ? (
          <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
            cycleDetected
          </Badge>
        ) : null}
      </div>

      {node.kind === 'enum' && node.members?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.members.map((member, idx) => (
            <Badge key={`${member}-${idx}`} variant="outline" className="rounded-xl px-2 text-[10px]">
              {member}
            </Badge>
          ))}
        </div>
      ) : null}

      {node.kind === 'object' && node.properties?.length
        ? node.properties.map((property, idx) => <TypeNodePropertyView key={`${property.name}-${idx}`} property={property} depth={depth} />)
        : null}

      {node.kind === 'array' && node.elementType ? <TypeNodeTree node={node.elementType} depth={depth + 1} /> : null}

      {(node.kind === 'union' || node.kind === 'intersection' || node.kind === 'function') && node.children?.length
        ? node.children.map((child, idx) => <TypeNodeTree key={`${node.kind}-child-${idx}`} node={child} depth={depth + 1} />)
        : null}

      {node.kind === 'record'
        ? (() => {
          if (node.indexSignature) {
            return (
              <div className="mt-3 rounded border border-gray-200/80 bg-white/70 p-2 dark:border-gray-800 dark:bg-gray-900/20">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Index signature</p>
                <TypeNodeTree node={node.indexSignature.key} depth={depth + 1} />
                <TypeNodeTree node={node.indexSignature.value} depth={depth + 1} />
              </div>
            );
          }
          return (
            <>
              {node.keyType ? <TypeNodeTree node={node.keyType} depth={depth + 1} /> : null}
              {node.valueType ? <TypeNodeTree node={node.valueType} depth={depth + 1} /> : null}
            </>
          );
        })()
        : null}

      {node.kind === 'set' && node.elementType ? <TypeNodeTree node={node.elementType} depth={depth + 1} /> : null}

      {node.kind === 'map'
        ? (
          <>
            {node.keyType ? <TypeNodeTree node={node.keyType} depth={depth + 1} /> : null}
            {node.valueType ? <TypeNodeTree node={node.valueType} depth={depth + 1} /> : null}
          </>
        )
        : null}

      {node.kind === 'ref' && node.refName ? (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Reference:</span> {node.refName}
        </p>
      ) : null}
    </div>
  );
};

/** Child properties as nested table rows (same columns as main table, with indented Name) */
const NestedTableRows: React.FC<{
  row: SlotMetadata;
  indentLevel: number;
  openSheet: (field: SlotMetadata) => void;
}> = ({ row, indentLevel, openSheet }) => {
  const childMap = row.items?.properties ?? row.properties;
  if (!childMap || Object.keys(childMap).length === 0) return null;

  const entries = Object.entries(childMap);
  const paddingLeft = 12 + indentLevel * 24;

  return (
    <>
      {entries.map(([key, prop]) => {
        const childRow: SlotMetadata = {
          ...prop,
          name: prop.name ?? key,
          id: prop.id ?? key,
          key: key,
        };
        const childHasNested =
          (childRow.items?.properties && Object.keys(childRow.items.properties).length > 0) ||
          (childRow.properties && Object.keys(childRow.properties).length > 0);
        if (childHasNested) {
          return (
            <ExpandableTableRow
              key={key}
              row={childRow}
              openSheet={openSheet}
              indentLevel={indentLevel}
            />
          );
        }
        const childTypeLabel = getTypeLabel(childRow);
        const childDefault = formatDefaultValue(childRow.default);
        return (
          <TableRow
            key={key}
            className="h-10 cursor-pointer border-b-[0.5px] hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
            onClick={() => openSheet(childRow)}
          >
            <TableCell
              className="whitespace-nowrap border-l-[0.5px] border-r-[0.5px] px-3 py-1"
              style={{ paddingLeft }}
            >
              <span className="truncate text-[15px] text-muted-foreground">{startCase(childRow.name)}</span>
            </TableCell>
            <TableCell className="overflow-hidden border-r-[0.5px] px-3.5 py-1">
              <Badge
                variant={getVariantForType(childRow.type)}
                className="inline-flex max-w-full overflow-hidden rounded-xl px-2.5 align-middle"
              >
                <span className="block w-full truncate font-mono text-[11px]">
                  {summarizeTypeLabel(childTypeLabel)}
                </span>
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap border-l-[0.5px] border-r-[0.5px] px-4 py-1 text-gray-600 dark:text-gray-300">
              {childRow.rules?.required ? 'Required' : 'Optional'}
            </TableCell>
            <TableCell className="border-r-[0.5px] px-4 py-1 text-gray-600 dark:text-gray-300">
              <span
                className={`slot-description block w-full overflow-hidden text-ellipsis whitespace-nowrap ${childDefault ? 'font-mono text-[12px] text-gray-700 dark:text-gray-200' : 'text-[11px] text-muted-foreground/70'}`}
              >
                {childDefault || '(no default)'}
              </span>
              <span className={`mt-1 block line-clamp-1 ${childRow.description ? 'text-[13px] text-muted-foreground' : 'text-[11px] text-muted-foreground/70'}`}>
                {childRow.description || '(no description)'}
              </span>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
};

const ExpandableTableRow: React.FC<{
  row: SlotMetadata;
  openSheet: (field: SlotMetadata) => void;
  indentLevel?: number;
}> = ({
  row,
  openSheet,
  indentLevel = 0,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasNestedStructure =
      (row.items?.properties && Object.keys(row.items.properties).length > 0) ||
      (row.properties && Object.keys(row.properties).length > 0);
    const canExpand =
      !!row.deepType || !!row.typeRefs?.length || !!row.warnings?.length || hasNestedStructure;
    const typeLabel = getTypeLabel(row);
    const defaultValue = formatDefaultValue(row.default);
    const nestedCount = hasNestedStructure
      ? Object.keys(row.items?.properties ?? row.properties ?? {}).length
      : 0;
    const namePaddingLeft = indentLevel > 0 ? 12 + indentLevel * 24 : undefined;

    const handleRowClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.expand-toggle')) {
        return;
      }
      openSheet(row);
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    };

    return (
      <>
        <TableRow className="h-10 cursor-pointer border-b-[0.5px]" onClick={handleRowClick}>
          <TableCell
            className="whitespace-nowrap border-l-[0.5px] border-r-[0.5px] px-3 py-1"
            style={namePaddingLeft != null ? { paddingLeft: namePaddingLeft } : undefined}
          >
            <div className="flex items-center">
              {canExpand ? (
                <button
                  className="expand-toggle mr-2 flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={handleExpandToggle}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                </button>
              ) : null}
              <span className="truncate text-[15px]">{startCase(row.name)}</span>
              {isExpanded && hasNestedStructure && nestedCount > 0 ? (
                <span className="ml-1.5 text-[13px] text-muted-foreground">
                  ({nestedCount} item field{nestedCount !== 1 ? 's' : ''})
                </span>
              ) : null}
            </div>
          </TableCell>
          <TableCell className="overflow-hidden border-r-[0.5px] px-3.5 py-1">
            <Badge variant={getVariantForType(row.type)} className="inline-flex max-w-full overflow-hidden rounded-xl px-2.5 align-middle">
              <span className="block w-full truncate font-mono text-[11px]">
                {summarizeTypeLabel(typeLabel)}
              </span>
            </Badge>
            {row.items?.properties && Object.keys(row.items.properties).length > 0 ? (
              <Badge variant="outline" className="ml-1 rounded-xl px-2 text-[10px]">
                object[]
              </Badge>
            ) : null}
            {row.warnings?.length ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="ml-1 rounded-xl px-2 text-[10px]">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {row.warnings.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs rounded-sm px-2 py-1 text-[11px]">
                    <div className="space-y-1">
                      {row.warnings.map((warning, idx) => (
                        <p key={`warning-${idx}`}>{warning}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </TableCell>
          <TableCell className="whitespace-nowrap border-l-[0.5px] border-r-[0.5px] px-4 py-1 text-gray-600 dark:text-gray-300">
            {row.rules?.required ? 'Required' : 'Optional'}
          </TableCell>
          <TableCell className="border-r-[0.5px] px-4 py-1 text-gray-600 dark:text-gray-300">
            <span
              className={`slot-description block w-full overflow-hidden text-ellipsis whitespace-nowrap ${defaultValue ? 'font-mono text-[12px] text-gray-700 dark:text-gray-200' : 'text-[11px] text-muted-foreground/70'}`}
            >
              {defaultValue || '(no default)'}
            </span>
            <span className={`mt-1 block line-clamp-1 ${row.description ? 'text-[13px] text-muted-foreground' : 'text-[11px] text-muted-foreground/70'}`}>
              {row.description || '(no description)'}
            </span>
          </TableCell>
        </TableRow>

        {isExpanded && canExpand ? (
          row.deepType ? (
            <TableRow className="border-b-[0.5px] bg-gray-50/40 dark:bg-gray-800/30">
              <TableCell colSpan={4} className="border-l-[0.5px] border-r-[0.5px] px-4 py-3">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/80 pb-2 dark:border-gray-800">
                    <p className="text-xs font-medium">Type tree</p>
                    <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
                      {typeLabel}
                    </Badge>
                    {row.deepType?.truncated ? (
                      <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
                        truncated
                      </Badge>
                    ) : null}
                    {row.deepType?.cycleDetected ? (
                      <Badge variant="outline" className="rounded-xl px-2 text-[10px]">
                        cycleDetected
                      </Badge>
                    ) : null}
                  </div>
                  {row.typeRefs?.length ? (
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Type refs</p>
                      <div className="flex flex-wrap gap-1">
                        {row.typeRefs.map((refName) => (
                          <Badge key={refName} variant="outline" className="rounded-xl px-2 text-[10px]">
                            {refName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <AnnotationList annotations={row.annotations} />
                  <TypeNodeTree node={row.deepType} />
                </div>
              </TableCell>
            </TableRow>
          ) : hasNestedStructure ? (
            <NestedTableRows row={row} indentLevel={indentLevel + 1} openSheet={openSheet} />
          ) : (
            <TableRow className="border-b-[0.5px] bg-gray-50/40 dark:bg-gray-800/30">
              <TableCell colSpan={4} className="border-l-[0.5px] border-r-[0.5px] px-4 py-3">
                <p className="mt-2 text-xs text-muted-foreground">No deep type available. Fallback: {row.docgenType || row.generic || row.type || 'unknown'}</p>
              </TableCell>
            </TableRow>
          )
        ) : null}
      </>
    );
  };
