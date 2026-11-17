'use client';

import { buildArtifactUrl } from '@handoff/artifacts/url';
import { CANVAS_DOCUMENT_PATH } from '@handoff/custom-previews/canvas';
import { CUSTOM_PREVIEW_FRAME_SANDBOX } from '@handoff/custom-previews/sandbox';
import type { ComponentCanvasProps } from '@handoff/screens/client-api';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loading } from './primitives';

const MOBILE_WIDTH = 375;
/** Typing in a form sends one render per pause, not one per keystroke. */
const RENDER_DELAY_MS = 60;

/**
 * Renders instances together in the canvas document (`canvas.render.html`), one sandboxed frame at
 * an opaque origin. The frame stays mounted while the list is empty, so the first instance renders
 * without a reload. The protocol is described in `src/custom-previews/canvas.ts`.
 */
export const ComponentCanvas: React.FC<ComponentCanvasProps> = ({
  items,
  viewport = 'desktop',
  zoom = 1,
  selectedId,
  onSelect,
  empty,
  onRenderError,
  mode = 'edit',
  className,
}) => {
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const ready = React.useRef(false);
  // The frame stays transparent until its first render, so it never flashes an empty page.
  const [hasRendered, setHasRendered] = React.useState(false);
  const latest = React.useRef({ items, selectedId, onSelect, onRenderError, mode });
  latest.current = { items, selectedId, onSelect, onRenderError, mode };
  const src = React.useMemo(() => buildArtifactUrl(CANVAS_DOCUMENT_PATH, process.env.HANDOFF_APP_BASE_PATH ?? ''), []);

  const post = React.useCallback(() => {
    if (!ready.current) return;
    // The frame has an opaque origin, which only the target origin '*' matches.
    frameRef.current?.contentWindow?.postMessage(
      {
        type: 'handoff:render-canvas',
        items: latest.current.items,
        selectedId: latest.current.selectedId ?? null,
        mode: latest.current.mode,
      },
      '*'
    );
  }, []);

  const itemsKey = JSON.stringify(items);
  React.useEffect(() => {
    const timer = window.setTimeout(post, RENDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [itemsKey, selectedId, mode, post]);

  // The frame's origin is 'null', so `event.source` identifies it. Its messages are only display data.
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; instanceId?: unknown; componentId?: unknown; message?: unknown } | null;
      if (data?.type === 'handoff:ready') {
        ready.current = true;
        post();
      } else if (data?.type === 'handoff:select' && typeof data.instanceId === 'string') {
        latest.current.onSelect?.(data.instanceId);
      } else if (data?.type === 'handoff:rendered') {
        setHasRendered(true);
      } else if (data?.type === 'handoff:render-error') {
        latest.current.onRenderError?.({
          instanceId: typeof data.instanceId === 'string' ? data.instanceId : undefined,
          componentId: typeof data.componentId === 'string' ? data.componentId : undefined,
          message: typeof data.message === 'string' ? data.message : 'The component could not render.',
        });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  const showEmpty = items.length === 0 && empty !== undefined;
  const mobile = viewport === 'mobile';
  const view = mode === 'view';

  return (
    <div className={cn('relative h-full w-full overflow-hidden', !view && 'bg-muted/30', className)}>
      {showEmpty && (
        <div className="flex h-full items-center justify-center overflow-y-auto p-8">
          <div className="w-full max-w-md">{empty}</div>
        </div>
      )}
      <div className={cn('h-full', !view && 'p-4', showEmpty && 'hidden')}>
        <div
          className={cn(
            'relative mx-auto h-full overflow-hidden bg-background transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            !view && 'rounded-lg border shadow-sm'
          )}
          style={{ width: mobile ? MOBILE_WIDTH * zoom : '100%' }}
        >
          {!hasRendered && <Loading label="Rendering" className="absolute inset-0" />}
          <div
            className={cn('transition-opacity duration-300 ease-out', !hasRendered && 'opacity-0')}
            style={{
              width: mobile ? MOBILE_WIDTH : `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <iframe
              ref={frameRef}
              src={src}
              title="Component canvas"
              sandbox={CUSTOM_PREVIEW_FRAME_SANDBOX}
              className="block h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
