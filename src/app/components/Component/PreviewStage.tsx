import { CUSTOM_PREVIEW_FRAME_SANDBOX } from '@handoff/custom-previews';
import { PreviewWidth } from '@handoff/transformers/preview/types';
import { frameUrlWithBackground } from '@handoff/transformers/utils/frame-layout';
import { Loader2, Maximize2, Minimize2, Monitor, PaintBucket, RefreshCcw, Smartphone, SquareArrowOutUpRight, Tablet } from 'lucide-react';
import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Longer than the card's duration-300 transition.
const COLLAPSE_MS = 340;

// Only `full` and `leaving` animate. The geometry must not animate across the change of positioning scheme.
type ExpandPhase = 'collapsed' | 'entering' | 'full' | 'leaving';

const SANDBOXED_FALLBACK_HEIGHT = '320px';

const SANDBOXED_MAX_HEIGHT = 20000;

// calc() rejects bare numbers, so a unitless defaultHeight gets `px`.
const toCssLength = (value: string): string => (/^\d+(\.\d+)?$/.test(value) ? `${value}px` : value);

const WIDTH_OPTION_CLASS =
  'relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md px-2.5 text-center text-xl transition-colors hover:bg-white hover:shadow-xs dark:hover:bg-gray-700 has-data-disabled:cursor-not-allowed has-data-[state=checked]:bg-blue-50 dark:has-data-[state=checked]:bg-blue-500/15 has-data-disabled:opacity-50 has-focus-visible:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-ring/70 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-blue-500/20 dark:has-data-[state=checked]:ring-blue-400/30';

const TOOLBAR_BUTTON_CLASS = 'h-7 px-2.5 hover:bg-white hover:shadow-xs dark:hover:bg-gray-700 [&_svg]:size-3';

const PAGE_BACKGROUND_KEY = 'handoff:preview:page-background';

const readPageBackground = (): boolean => {
  try {
    return window.localStorage.getItem(PAGE_BACKGROUND_KEY) === 'on';
  } catch {
    return false;
  }
};

const writePageBackground = (show: boolean): void => {
  try {
    if (show) window.localStorage.setItem(PAGE_BACKGROUND_KEY, 'on');
    else window.localStorage.removeItem(PAGE_BACKGROUND_KEY);
  } catch {
    /* empty */
  }
};

export interface PreviewStageProps {
  src: string | null;
  frameKey: string;
  title?: string;
  defaultHeight?: string;
  defaultWidth?: PreviewWidth;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  openUrl?: string | null;
  frameRef?: React.MutableRefObject<HTMLIFrameElement | null>;
  onFrameLoad?: () => void;
  emptyMessage?: string;
  transitionName?: string;
  sandboxed?: boolean;
  /** Opens the frame on a transparent background, with a toggle for the project's page background. Element frames only. */
  backgroundControl?: boolean;
  /** Rendered inside the card under the canvas, so the preview and its code sample read as one block. Folded away while expanded. */
  footer?: React.ReactNode;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  src,
  frameKey,
  title,
  defaultHeight,
  defaultWidth,
  leading,
  actions,
  openUrl,
  frameRef,
  onFrameLoad,
  emptyMessage = 'No preview available for this selection.',
  transitionName,
  sandboxed = false,
  backgroundControl = false,
  footer,
}) => {
  const ownFrameRef = React.useRef<HTMLIFrameElement | null>(null);
  const ref = frameRef ?? ownFrameRef;
  const cardRef = React.useRef<HTMLDivElement>(null);
  const collapseTimer = React.useRef<number | undefined>(undefined);
  const contentObserver = React.useRef<ResizeObserver | null>(null);
  const stageObserver = React.useRef<ResizeObserver | null>(null);
  const [height, setHeight] = React.useState('100px');
  const [previewWidth, setPreviewWidth] = React.useState<PreviewWidth>(defaultWidth ?? 'fluid');
  const [stageWidth, setStageWidth] = React.useState(0);
  const [phase, setPhase] = React.useState<ExpandPhase>('collapsed');
  // A sandboxed frame cannot be reloaded through its cross-origin `location`, so Refresh remounts it.
  const [reloadCount, setReloadCount] = React.useState(0);
  const frameId = `${frameKey}-${reloadCount}`;
  // Derived from the frame id, so a new frame starts loading in the same render that mounts it.
  const [loadedFrameId, setLoadedFrameId] = React.useState<string | null>(null);
  const isLoading = loadedFrameId !== frameId;
  const [showPageBackground, setShowPageBackground] = React.useState(false);
  // Runs before the frame mounts, so a stored choice never shows the other background first.
  React.useLayoutEffect(() => setShowPageBackground(readPageBackground()), []);
  const transparent = backgroundControl && !showPageBackground;
  const frameSrc = src && backgroundControl ? frameUrlWithBackground(src, transparent ? 'transparent' : 'page') : src;
  const togglePageBackground = () => {
    writePageBackground(!showPageBackground);
    setShowPageBackground(!showPageBackground);
  };
  // Viewport percentages, like the expanded card: a transition from px to vw does not interpolate.
  const [originRect, setOriginRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const expanded = phase !== 'collapsed';
  const animates = phase === 'full' || phase === 'leaving';

  const renderWidth = previewWidth === 'fluid' ? stageWidth : previewWidth;
  const scale = renderWidth > stageWidth ? stageWidth / renderWidth : 1;

  // The card floats in place: moving it into a dialog would remount and reload the iframe.
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

  // A timer, not transitionend: under reduced motion no transition runs, so the event never fires.
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
    // index.css drops the column's view-transition-name while this is set, so the expanded card paints on top.
    document.documentElement.dataset.previewExpanded = 'true';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = pageOverflow;
      delete document.documentElement.dataset.previewExpanded;
    };
  }, [expanded]);

  // No ease while the card moves: its target changes every frame, so the stage would trail the preview.
  const boxTransition = animates
    ? 'none'
    : previewWidth === 'fluid'
      ? 'height 0.2s ease-in-out'
      : 'width 0.2s ease-in-out, height 0.2s ease-in-out';

  // A hidden tab delivers no ResizeObserver entry, so the first width is read directly.
  const observeStage = useCallback((stage: HTMLDivElement | null) => {
    stageObserver.current?.disconnect();
    if (!stage) return;
    setStageWidth(stage.clientWidth);
    stageObserver.current = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    stageObserver.current.observe(stage);
  }, []);

  const measure = useCallback(() => {
    contentObserver.current?.disconnect();

    if (defaultHeight) {
      setHeight(toCssLength(defaultHeight));
      return;
    }
    if (sandboxed) return;

    const body = ref.current?.contentWindow?.document?.body;
    if (!body) return;

    const update = () => setHeight(body.scrollHeight + 'px');
    update();
    contentObserver.current = new ResizeObserver(update);
    contentObserver.current.observe(body);
  }, [defaultHeight, ref, sandboxed]);

  React.useEffect(() => {
    if (!sandboxed || defaultHeight) return;
    setHeight(SANDBOXED_FALLBACK_HEIGHT);
    const onMessage = (event: MessageEvent) => {
      // The frame has an opaque origin, so `event.source` identifies it.
      if (event.source !== ref.current?.contentWindow || event.data?.type !== 'handoff:resize') return;
      const next = Number(event.data.height);
      if (Number.isFinite(next) && next > 0) setHeight(`${Math.min(Math.ceil(next), SANDBOXED_MAX_HEIGHT)}px`);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sandboxed, defaultHeight, ref, frameKey, reloadCount]);

  const onLoad = useCallback(() => {
    setLoadedFrameId(frameId);
    measure();
    onFrameLoad?.();
  }, [frameId, measure, onFrameLoad]);

  const refresh = () => {
    if (sandboxed) {
      setReloadCount((count) => count + 1);
      return;
    }
    setLoadedFrameId(null);
    ref.current?.contentWindow?.location.reload();
  };

  React.useEffect(() => {
    measure();
  }, [measure]);

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

  const collapsedStyle: React.CSSProperties = { position: 'fixed', zIndex: 50 };
  const originStyle: React.CSSProperties = originRect
    ? { top: `${originRect.top}%`, left: `${originRect.left}%`, width: `${originRect.width}%`, transform: 'translateY(0)' }
    : {};
  const freeWidth = 'calc(100vw - var(--ai-dock-width, 0px))';
  const fullSizeStyle: React.CSSProperties = {
    ...collapsedStyle,
    top: '50%',
    left: `calc(${freeWidth} * 0.02)`,
    width: `calc(${freeWidth} * 0.96)`,
    maxHeight: '92vh',
    transform: 'translateY(-50%)',
  };

  // Open in every phase but `full`. The footer folds away while the card grows and unfolds while it
  // shrinks, so the first expanding frame matches the card's rect and the card returns to the flow at
  // the height its placeholder kept.
  const footerOpen = phase !== 'full';

  const card = (
    <div
      ref={cardRef}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? `${title ?? 'Component'} preview` : undefined}
      style={
        expanded
          ? phase === 'full'
            ? fullSizeStyle
            : { ...collapsedStyle, ...originStyle }
          : transitionName
            ? ({ viewTransitionName: transitionName } as React.CSSProperties)
            : undefined
      }
      className={`text-medium flex w-full flex-col items-center rounded-lg border border-gray-200 dark:border-gray-900 ${
        expanded ? 'overflow-hidden bg-background shadow-xl' : ''
      } ${animates ? 'transition-[top,left,width,transform] duration-300 ease-out motion-reduce:transition-none' : ''}`}
    >
      <div className="flex w-full items-center justify-between rounded-t-lg bg-gray-50 px-6 py-2 pr-3 align-middle @container dark:bg-gray-800">
        <div className="flex flex-1 items-start gap-2">{leading}</div>
        <div className="hidden items-center gap-1 @xl:flex">
          {scale < 1 && (
            <>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="px-3 font-mono text-[11px] text-gray-500">{Math.round(scale * 100)}%</span>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">
                    Too wide for this column. Expand to see it at full size.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Separator orientation="vertical" className="mx-2 h-6 dark:bg-gray-600" />
            </>
          )}
          <TooltipProvider delayDuration={0}>
            <RadioGroup
              className="flex items-center gap-1"
              value={String(previewWidth)}
              onValueChange={(value) => setPreviewWidth(value === 'fluid' ? 'fluid' : Number(value))}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className={`${WIDTH_OPTION_CLASS} ring-inset [&_svg]:size-3`}>
                    <RadioGroupItem value="fluid" aria-label="Fill the available width" className="sr-only after:absolute after:inset-0" />
                    <Monitor />
                  </label>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">
                  Full width
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className={`${WIDTH_OPTION_CLASS} [&_svg]:size-3`}>
                    <RadioGroupItem value="800" aria-label="Tablet width, 800px" className="sr-only after:absolute after:inset-0" />
                    <Tablet />
                  </label>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">
                  Tablet (800px)
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className={`${WIDTH_OPTION_CLASS} [&_svg]:size-2.5`}>
                    <RadioGroupItem value="400" aria-label="Mobile width, 400px" className="sr-only after:absolute after:inset-0" />
                    <Smartphone />
                  </label>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">
                  Mobile (400px)
                </TooltipContent>
              </Tooltip>
            </RadioGroup>
          </TooltipProvider>
          <Separator orientation="vertical" className="mx-2 h-6 dark:bg-gray-600" />
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className={TOOLBAR_BUTTON_CLASS} onClick={refresh} variant="ghost">
                  <RefreshCcw />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">Refresh Preview</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {backgroundControl && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Page background"
                    aria-pressed={showPageBackground}
                    className={showPageBackground ? 'h-7 px-2.5 [&_svg]:size-3' : TOOLBAR_BUTTON_CLASS}
                    onClick={togglePageBackground}
                    variant={showPageBackground ? 'default' : 'ghost'}
                  >
                    <PaintBucket />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">
                  {showPageBackground ? 'Hide Page Background' : 'Show Page Background'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {actions}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={expanded ? 'Collapse preview' : 'Expand preview'}
                  className={TOOLBAR_BUTTON_CLASS}
                  onClick={() => (expanded ? collapse() : expand())}
                  variant="ghost"
                >
                  {expanded ? <Minimize2 /> : <Maximize2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">{expanded ? 'Collapse Preview' : 'Expand Preview'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {openUrl && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className={TOOLBAR_BUTTON_CLASS} onClick={() => window.open(openUrl, '_blank')} variant="ghost">
                    <SquareArrowOutUpRight />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">Open in New Tab</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className={`dotted-bg w-full p-4 ${expanded ? 'min-h-0' : ''} ${footer ? '' : 'rounded-b-lg'}`}>
        {src ? (
          // A transform does not shrink the layout box, so the inner div carries the scaled size.
          <div ref={observeStage}>
            {renderWidth > 0 && (
              <div
                className="relative"
                aria-busy={isLoading}
                style={{
                  width: renderWidth * scale,
                  height: `calc(${height} * ${scale})`,
                  margin: '0 auto',
                  transition: boxTransition,
                }}
              >
                {/* Fades in after a delay, so a fast load shows no spinner. */}
                {isLoading && (
                  <div
                    role="status"
                    aria-label="Loading preview"
                    className="absolute inset-0 flex items-center justify-center duration-200 animate-in [animation-delay:300ms] [animation-fill-mode:both] fade-in"
                  >
                    <Loader2 className="size-5 animate-spin text-gray-400 dark:text-gray-500" aria-hidden />
                  </div>
                )}
                <iframe
                  key={frameId}
                  onLoad={onLoad}
                  ref={ref}
                  title={title}
                  sandbox={sandboxed ? CUSTOM_PREVIEW_FRAME_SANDBOX : undefined}
                  style={{
                    width: renderWidth,
                    height: height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'left top',
                    transition: animates ? 'none' : 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out',
                    opacity: isLoading ? 0 : 1,
                    display: 'block',
                    // Under the dark docs theme, the browser paints an opaque backdrop behind a frame whose
                    // color scheme differs from the page. The frame's document declares none.
                    colorScheme: transparent ? 'light' : undefined,
                  }}
                  src={frameSrc ?? undefined}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 text-sm text-gray-500">{emptyMessage}</div>
        )}
      </div>
      {/* Folded, not unmounted, while expanded, so the code sample keeps its open state and format.
          The border sits inside the animated grid row so it folds away too. */}
      {footer ? (
        <div
          inert={!footerOpen}
          className={`grid w-full min-w-0 transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
            footerOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden rounded-b-lg border-t border-gray-200 dark:border-gray-900">{footer}</div>
        </div>
      ) : null}
    </div>
  );

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
