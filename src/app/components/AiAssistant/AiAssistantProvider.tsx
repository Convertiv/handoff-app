'use client';

import { useSession } from 'next-auth/react';
import * as React from 'react';
import { SheetClose } from '../ui/sheet';
import { AiAssistantDialog } from './AiAssistantDialog';
import { AiEdge, AiMark } from './AiMark';

/**
 * Availability and open state for the docs assistant.
 *
 * Availability comes from values baked in at build time (the `env` block in `next.config.mjs`): a
 * static export has no API routes, and a build without `runtime.ai` has no chat route. The triggers
 * are gated on the same values, so such a build shows no affordance rather than one that fails.
 *
 * The header hides its controls below the `@2xl` container width, so the mobile nav needs a trigger
 * of its own. Both open the one dialog this provider renders, which is also what `⌘K` (`Ctrl K`
 * away from Apple keyboards) reaches.
 *
 * Registry mode adds a second condition: the chat route authorizes on the session, so a signed-out
 * reader sees no control rather than one that answers 401.
 */
const isAvailable = process.env.HANDOFF_AI_ENABLED === 'true' && process.env.HANDOFF_BUILD_TARGET !== 'static';
const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

const AiAssistantContext = React.createContext<{ open: () => void } | null>(null);

/** The opener, or `null` where this build has no assistant. */
export const useAiAssistant = (): { open: () => void } | null => React.useContext(AiAssistantContext);

export const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isAvailable && isRegistryRuntime ? (
    <RegistryAiAssistantProvider>{children}</RegistryAiAssistantProvider>
  ) : (
    <AiAssistant available={isAvailable}>{children}</AiAssistant>
  );

/** `useSession` needs the registry session provider, which only registry mode mounts. */
const RegistryAiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  return <AiAssistant available={Boolean(session?.user)}>{children}</AiAssistant>;
};

const AiAssistant: React.FC<{ children: React.ReactNode; available: boolean }> = ({ children, available }) => {
  const [open, setOpen] = React.useState(false);
  const value = React.useMemo(() => ({ open: () => setOpen(true) }), []);

  React.useEffect(() => {
    if (!available) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [available]);

  if (!available) return <>{children}</>;

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      <AiAssistantDialog open={open} onOpenChange={setOpen} />
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
    <button
      type="button"
      onClick={assistant.open}
      title="Ask the design system"
      className="group relative inline-flex h-8 shrink-0 items-center rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ai-via/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-full bg-linear-to-r from-ai-from via-ai-via to-ai-to opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-40"
      />
      <span className="relative flex h-full items-center overflow-hidden rounded-full p-px">
        <AiEdge motion="hover" className="opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="relative flex h-full items-center gap-2 rounded-full bg-background px-3">
          <AiMark className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-90" />
          <span className="text-sm font-medium">Ask</span>
          <kbd className="rounded-sm border bg-muted px-1 font-mono text-[10px] leading-[14px] text-muted-foreground">{shortcut}</kbd>
        </span>
      </span>
    </button>
  );
}

/**
 * The same entry point for the mobile nav. It must sit inside that nav's sheet: the assistant is a
 * dialog, so the sheet must close as the dialog opens. If both stay open, they fight over focus.
 */
export function AiAssistantMobileTrigger() {
  const assistant = useAiAssistant();
  if (!assistant) return null;

  return (
    <SheetClose asChild>
      <button
        type="button"
        onClick={assistant.open}
        className="group relative flex w-full items-center overflow-hidden rounded-lg p-px text-left outline-hidden focus-visible:ring-2 focus-visible:ring-ai-via/50"
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
