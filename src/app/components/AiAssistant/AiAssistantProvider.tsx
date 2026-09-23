'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import * as React from 'react';

import { useIsMobile } from '../../hooks/use-mobile';
import { SheetClose } from '../ui/sheet';
import { AiAssistantPanel } from './AiAssistantPanel';
import { AiEdge, AiMark } from './AiMark';
import { DEFAULT_DOCK, DOCK_WIDTH_VAR, clampWidth, dockWidth, isAiAssistantRoute, readDock, writeDock, type DockState } from './dockState';

/**
 * Availability and dock state for the docs assistant.
 *
 * Availability comes from values baked in at build time (the `env` block in `next.config.mjs`): a
 * static export has no API routes, and a build without `runtime.ai` has no chat route. The triggers
 * are gated on the same values, so such a build shows no affordance rather than one that fails.
 *
 * The header hides its controls below the `@2xl` container width, so the mobile nav needs a trigger
 * of its own. Both reach the one panel this provider renders, which is also what `⌘K` (`Ctrl K`
 * away from Apple keyboards) toggles.
 *
 * Registry mode adds a second condition: the chat route authorizes on the session, so a signed-out
 * reader sees no control rather than one that answers 401.
 *
 * Mounted in `_app`, above the page tree. That position is what makes the pinned panel possible:
 * every page builds its own `Layout`, so anything inside one is unmounted by the next soft
 * navigation, along with the conversation in it.
 */
const isAvailable = process.env.HANDOFF_AI_ENABLED === 'true' && process.env.HANDOFF_BUILD_TARGET !== 'static';
const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

interface AiAssistantApi {
  isOpen: boolean;
  open: () => void;
  toggle: () => void;
}

const AiAssistantContext = React.createContext<AiAssistantApi | null>(null);

/** The opener, or `null` where this build has no assistant. */
export const useAiAssistant = (): AiAssistantApi | null => React.useContext(AiAssistantContext);

export const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const visible = isAiAssistantRoute(router.pathname);
  const page = <div className={visible ? 'ai-dock-inset' : undefined}>{children}</div>;

  return isAvailable && isRegistryRuntime ? (
    <RegistryAiAssistantProvider visible={visible}>{page}</RegistryAiAssistantProvider>
  ) : (
    <AiAssistant available={isAvailable} visible={visible}>
      {page}
    </AiAssistant>
  );
};

/**
 * `useSession` needs the registry session provider, which only registry mode mounts.
 *
 * A loading session reports `undefined` and not `false`: the inline script may already have reserved
 * the dock's column, and a `false` here would take it back and give it again once the session lands.
 */
const RegistryAiAssistantProvider: React.FC<{ children: React.ReactNode; visible: boolean }> = ({ children, visible }) => {
  const { data: session, status } = useSession();
  return (
    <AiAssistant available={status === 'loading' ? undefined : Boolean(session?.user)} visible={visible}>
      {children}
    </AiAssistant>
  );
};

const AiAssistant: React.FC<{ children: React.ReactNode; available: boolean | undefined; visible: boolean }> = ({
  children,
  available,
  visible,
}) => {
  const isMobile = useIsMobile();
  const [dock, setDock] = React.useState<DockState>(DEFAULT_DOCK);
  // Read after mount: the server cannot see it, and a first render that disagreed would fail
  // hydration.
  const [restored, setRestored] = React.useState(false);

  const change = React.useCallback((next: Partial<DockState>) => {
    setDock((current) => ({ ...current, ...next, width: clampWidth(next.width ?? current.width) }));
  }, []);

  const value = React.useMemo<AiAssistantApi>(
    () => ({
      isOpen: dock.open,
      open: () => change({ open: true }),
      toggle: () => setDock((current) => ({ ...current, open: !current.open })),
    }),
    [change, dock.open]
  );

  React.useEffect(() => {
    if (available !== true) return;
    setDock(readDock());
    setRestored(true);
  }, [available]);

  React.useEffect(() => {
    if (restored) writeDock(dock);
  }, [restored, dock]);

  /**
   * The column the page leaves free.
   *
   * Nothing is written while the stored state is still out: the inline script in `_document` has
   * already put the right value there, and an intermediate `0px` would reflow the page. A reader
   * with no assistant must take the column back, because the script cannot see a signed-out session.
   */
  React.useEffect(() => {
    if (!visible) {
      const root = document.documentElement;
      root.style.setProperty(DOCK_WIDTH_VAR, '0px');
      delete root.dataset.aiDockOpen;
      return;
    }
    if (available === undefined) return;
    if (available && !restored) return;
    const root = document.documentElement;
    root.style.setProperty(DOCK_WIDTH_VAR, `${available && !isMobile ? dockWidth(dock) : 0}px`);
    if (available && dock.open) root.dataset.aiDockOpen = 'true';
    else delete root.dataset.aiDockOpen;
  }, [available, restored, isMobile, dock, visible]);

  React.useEffect(() => {
    if (available !== true || !visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        value.toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [available, value, visible]);

  if (available !== true || !visible) return <>{children}</>;

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      {restored && <AiAssistantPanel state={dock} isMobile={isMobile} onChange={change} />}
    </AiAssistantContext.Provider>
  );
};

/**
 * The keyboard shortcut label, written for the keyboard in front of the reader.
 *
 * The value must settle after mount, not during render. This app is prerendered, so a value read
 * from `navigator` during render disagrees with the markup that React hydrates. The prerendered
 * HTML carries the Apple form, and every other platform corrects it in the first effect.
 */
const useShortcutLabel = (): string => {
  const [label, setLabel] = React.useState('⌘K');

  React.useEffect(() => {
    if (!/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)) setLabel('Ctrl K');
  }, []);

  return label;
};

/**
 * The header control.
 *
 * Nothing moves at rest. This control sits in the chrome of every page, where constant motion is a
 * distraction and not a signal. The motion belongs to hover.
 *
 * It must not look like a search field. This control opens a conversation, not a result list, and
 * the app has no search to confuse it with.
 */
export function AiAssistantTrigger() {
  const assistant = useAiAssistant();
  const shortcut = useShortcutLabel();
  if (!assistant) return null;

  return (
    <span className="ai-assistant-trigger" data-open={assistant.isOpen} inert={assistant.isOpen}>
      <button
        type="button"
        onClick={assistant.toggle}
        title="Ask the design system"
        aria-expanded={assistant.isOpen}
        className="outline-hidden focus-visible:ring-ai-via/50 group relative inline-flex h-8 shrink-0 items-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          aria-hidden="true"
          className="bg-linear-to-r from-ai-from via-ai-via to-ai-to pointer-events-none absolute -inset-1 rounded-full opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-40"
        />
        <span className="relative flex h-full items-center overflow-hidden rounded-full p-px">
          <AiEdge motion="hover" className="opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative flex h-full items-center gap-2 rounded-full bg-background px-3">
            <AiMark className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
            <span className="text-sm font-medium">Ask</span>
            <kbd className="rounded-sm border bg-muted px-1 font-mono text-[10px] leading-[14px] text-muted-foreground">{shortcut}</kbd>
          </span>
        </span>
      </button>
    </span>
  );
}

/**
 * The same entry point for the mobile nav. It must sit inside that nav's sheet: the assistant is a
 * sheet of its own on a narrow viewport, and two open sheets fight over focus.
 */
export function AiAssistantMobileTrigger() {
  const assistant = useAiAssistant();
  if (!assistant) return null;

  return (
    <SheetClose asChild>
      <button
        type="button"
        onClick={assistant.open}
        className="outline-hidden focus-visible:ring-ai-via/50 group relative flex w-full items-center overflow-hidden rounded-lg p-px text-left focus-visible:ring-2"
      >
        <AiEdge motion="hover" className="opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="relative flex w-full items-center gap-2.5 rounded-[7px] bg-background px-3 py-2.5">
          <AiMark className="h-4 w-4" />
          <span className="text-sm font-medium">Ask</span>
        </span>
      </button>
    </SheetClose>
  );
}
