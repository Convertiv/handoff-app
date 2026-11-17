'use client';

import type {
  DocumentStatus,
  ScreenActionProps,
  ScreenLayoutComponent,
  ScreenPanelProps,
  ScreenStatusProps,
} from '@handoff/screens/client-api';
import {
  Check,
  ChevronLeft,
  CircleAlert,
  CircleDot,
  House,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { SCREEN_CHROME_ATTRIBUTE } from '../../lib/screens/client/chrome';
import { useScreenContext } from '../../lib/screens/client/context';
import { cn } from '../../lib/utils';
import { useAiAvailable } from '../AiAssistant/AiAssistantProvider';
import { AiConversation } from '../AiAssistant/AiConversation';
import { Button } from '../ui/button';
import { renderIcon } from './primitives';

/**
 * The frame of a screen: a toolbar, an optional left column, the main area and an optional
 * assistant column. The route already gives the screen the full height under the docs header.
 */

/** A flag kept per reader in `localStorage`, read after mount so the server render matches. */
const usePersistentFlag = (key: string, initial: boolean): [boolean, (next: boolean) => void] => {
  const [value, setValue] = React.useState(initial);
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(stored === 'true');
    } catch {
      /* empty */
    }
  }, [key]);
  const change = React.useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        /* empty */
      }
    },
    [key]
  );
  return [value, change];
};

const ASSISTANT_KEY = 'handoff:screens:assistant';

const Action: React.FC<ScreenActionProps> = ({ icon, label, onClick, active, disabled }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon-sm"
    title={label}
    aria-label={label}
    aria-pressed={active === undefined ? undefined : active}
    disabled={disabled}
    onClick={onClick}
    className={cn('h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground', active && 'bg-accent text-accent-foreground')}
  >
    {renderIcon(icon)}
  </Button>
);

const Divider: React.FC = () => <div aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />;

const Spacer: React.FC = () => <div aria-hidden className="flex-1" />;

const STATUS: Record<Exclude<DocumentStatus, 'idle'>, { label: string; icon: React.ReactNode }> = {
  loading: { label: 'Loading', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  missing: { label: 'Not found', icon: <CircleAlert className="h-3.5 w-3.5" /> },
  saved: { label: 'Saved', icon: <Check className="h-3.5 w-3.5" /> },
  dirty: { label: 'Unsaved changes', icon: <CircleDot className="h-3.5 w-3.5" /> },
  saving: { label: 'Saving…', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  conflict: { label: 'Changed elsewhere', icon: <TriangleAlert className="h-3.5 w-3.5 text-amber-500" /> },
  error: { label: 'Not saved', icon: <CircleAlert className="h-3.5 w-3.5 text-destructive" /> },
};

const Status: React.FC<ScreenStatusProps> = ({ document, state }) => {
  const status = state ?? document?.status ?? 'idle';
  if (status === 'idle') return null;
  const { label, icon } = STATUS[status];
  return (
    <div
      className="flex shrink-0 items-center gap-1.5 px-1.5 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
      title={document?.error ?? undefined}
    >
      {icon}
      <span className={cn(status === 'error' && 'text-destructive')}>{label}</span>
      {status === 'conflict' && document && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-1 h-6 px-2 text-[11px]"
            onClick={() => document.resolveConflict('mine')}
          >
            Keep mine
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => document.resolveConflict('theirs')}
          >
            Take theirs
          </Button>
        </>
      )}
    </div>
  );
};

const Panel: React.FC<ScreenPanelProps> = ({ title, count, onBack, actions, footer, children, className }) => (
  <section className={cn('flex h-full min-h-0 flex-col', onBack && 'duration-200 animate-in fade-in slide-in-from-left-4', className)}>
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b px-3 text-[13px] font-semibold">
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onBack}
          aria-label="Back"
          title="Back"
          className="-ml-1 text-muted-foreground"
        >
          <ChevronLeft />
        </Button>
      )}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">{count}</span>
      )}
      {actions}
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    {footer && <footer className="shrink-0 border-t p-3">{footer}</footer>}
  </section>
);

const ScreenLayoutBase: React.FC<React.ComponentProps<ScreenLayoutComponent>> = ({ toolbar, left, assistant, children }) => {
  const { screen, fullscreen } = useScreenContext();
  const assistantAvailable = useAiAvailable() === true;
  const [assistantOpen, setAssistantOpen] = usePersistentFlag(ASSISTANT_KEY, false);
  const [leftOpen, setLeftOpen] = usePersistentFlag(`handoff:screens:${screen.id}:left`, true);
  const showAssistant = Boolean(assistant) && assistantAvailable;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
        {fullscreen && (
          <>
            {/* Without the docs header, this is the way back to the docs. */}
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              title="Back to the docs"
              aria-label="Back to the docs"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Link href="/">
                <House />
              </Link>
            </Button>
            <Divider />
          </>
        )}
        {left && (
          <>
            <Action
              icon={leftOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
              label={leftOpen ? 'Hide the side panel' : 'Show the side panel'}
              onClick={() => setLeftOpen(!leftOpen)}
            />
            <Divider />
          </>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1">{toolbar}</div>
        {showAssistant && (
          <>
            <Divider />
            <Action
              icon={<Sparkles className={cn(assistantOpen && 'text-primary')} />}
              label={assistantOpen ? 'Hide the assistant' : 'Show the assistant'}
              active={assistantOpen}
              onClick={() => setAssistantOpen(!assistantOpen)}
            />
          </>
        )}
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {left && leftOpen && <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-r">{left}</aside>}
        <main className="relative min-w-0 flex-1 overflow-hidden">{children}</main>
        {showAssistant && assistantOpen && (
          <aside aria-label="Assistant" {...{ [SCREEN_CHROME_ATTRIBUTE]: '' }} className="flex w-80 shrink-0 flex-col overflow-hidden border-l">
            <AiConversation
              active
              title="Assistant"
              controls={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setAssistantOpen(false)}
                  title="Hide the assistant"
                  aria-label="Hide the assistant"
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              }
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export const ScreenLayout: ScreenLayoutComponent = Object.assign(ScreenLayoutBase, { Panel, Status, Action, Divider, Spacer });
