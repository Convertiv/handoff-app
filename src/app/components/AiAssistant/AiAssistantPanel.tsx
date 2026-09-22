'use client';

import { PanelRightClose, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../ui/sheet';
import { AiConversation } from './AiConversation';
import { AiEdge, AiMark } from './AiMark';
import { DOCK_WIDTH_VAR, fitWidth, MAX_WIDTH, MIN_WIDTH, type DockState } from './dockState';
import { useAiChat } from './useAiChat';

/**
 * Where the conversation sits: a column pinned to the right of the page, not a modal, so the reader
 * can browse the docs and read the answer at once. A narrow viewport has no room for two columns,
 * so the same conversation moves into a sheet.
 *
 * Nothing here owns the conversation. {@link useAiChat} does, so none of these moves can discard it.
 */

const RESIZE_STEP = 16;

const IconButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="focus-visible:ring-ai-via/50 outline-hidden flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2"
  >
    {children}
  </button>
);

/** The collapsed dock. It reports an arriving answer, which the hidden transcript cannot. */
const Rail: React.FC<{ busy: boolean; onExpand: () => void; onClose: () => void }> = ({ busy, onExpand, onClose }) => (
  <div className="flex h-full flex-col items-center gap-1 py-3">
    <button
      type="button"
      onClick={onExpand}
      title="Open the assistant"
      aria-label="Open the assistant"
      aria-expanded={false}
      className="focus-visible:ring-ai-via/50 outline-hidden group relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg p-px focus-visible:ring-2"
    >
      <AiEdge motion={busy ? 'always' : 'hover'} />
      <span className="relative flex h-full w-full items-center justify-center rounded-[7px] bg-background">
        <AiMark className="h-4 w-4" />
      </span>
    </button>
    <IconButton label="Close the assistant" onClick={onClose}>
      <X className="h-4 w-4" />
    </IconButton>
  </div>
);

/**
 * A drag writes the width straight to `--ai-dock-width` and reports it to React only on release: a
 * state change per pointer move would re-render the whole page under the dock once a frame. The
 * `data-ai-dock-resizing` flag drops the transition for the drag, so the edge tracks the pointer.
 *
 * The dock is anchored right, so the width is the pointer's distance from that edge.
 */
const ResizeHandle: React.FC<{ width: number; onCommit: (width: number) => void }> = ({ width, onCommit }) => {
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const root = document.documentElement;
    let next = width;

    const onMove = (move: PointerEvent) => {
      next = fitWidth(window.innerWidth - move.clientX);
      root.style.setProperty(DOCK_WIDTH_VAR, `${next}px`);
    };
    const onUp = () => {
      delete root.dataset.aiDockResizing;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      onCommit(next);
    };

    root.dataset.aiDockResizing = 'true';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the assistant"
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onCommit(fitWidth(width + RESIZE_STEP));
        else if (event.key === 'ArrowRight') onCommit(fitWidth(width - RESIZE_STEP));
        else return;
        event.preventDefault();
      }}
      // Inside the panel: the dock clips its overflow, so a handle across the border loses half its
      // hit area.
      className="focus-visible:bg-ai-via/60 outline-hidden hover:bg-ai-via/40 absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize transition-colors"
    />
  );
};

export const AiAssistantPanel: React.FC<{
  state: DockState;
  isMobile: boolean;
  onChange: (next: Partial<DockState>) => void;
}> = ({ state, isMobile, onChange }) => {
  const { status } = useAiChat();
  // Keep the scroll position and an unsent draft across a close, without costing a reader who never
  // opens the assistant anything.
  const [everOpened, setEverOpened] = React.useState(state.open);
  const busy = status === 'submitted' || status === 'streaming';
  const close = () => onChange({ open: false });

  React.useEffect(() => {
    if (state.open) setEverOpened(true);
  }, [state.open]);

  if (isMobile) {
    return (
      <Sheet open={state.open} onOpenChange={(open) => onChange({ open })}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md [&>button:first-of-type]:hidden">
          <SheetTitle className="sr-only">Ask the design system</SheetTitle>
          <SheetDescription className="sr-only">
            Answers come from the components, tokens and documentation of this design system.
          </SheetDescription>
          <AiConversation
            active={state.open}
            controls={
              <IconButton label="Close the assistant" onClick={close}>
                <X className="h-4 w-4" />
              </IconButton>
            }
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Design system assistant"
      // The closed dock stays mounted at zero width, so `inert` has to keep it out of the tab order
      // and the accessibility tree.
      inert={!state.open}
      style={{ width: `var(${DOCK_WIDTH_VAR}, 0px)` }}
      className={cn(
        'ai-dock fixed inset-y-0 right-0 z-50 flex flex-col overflow-hidden bg-background',
        state.open && 'border-l shadow-[-1px_0_3px_0_rgba(0,0,0,0.06)]'
      )}
    >
      {/*
        Mounted behind the rail, so collapsing keeps the scroll position and an unsent draft. Held at
        the open width and pinned to the trailing edge, so a narrowing panel slides the conversation
        out instead of reflowing the transcript on every frame of the close.
      */}
      {everOpened && (
        <div
          className={cn('absolute inset-y-0 right-0 flex min-h-0 flex-col', state.minified && 'hidden')}
          style={{ width: `${state.width}px` }}
        >
          <AiConversation
            active={state.open && !state.minified}
            controls={
              <>
                <IconButton label="Collapse the assistant" onClick={() => onChange({ minified: true })}>
                  <PanelRightClose className="h-4 w-4" />
                </IconButton>
                <IconButton label="Close the assistant" onClick={close}>
                  <X className="h-4 w-4" />
                </IconButton>
              </>
            }
          />
        </div>
      )}
      {state.minified && <Rail busy={busy} onExpand={() => onChange({ minified: false })} onClose={close} />}
      {state.open && !state.minified && <ResizeHandle width={state.width} onCommit={(width) => onChange({ width })} />}
    </aside>
  );
};
