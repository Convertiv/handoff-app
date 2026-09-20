'use client';

import { Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import * as React from 'react';
import { Button } from '../ui/button';
import { SheetClose } from '../ui/sheet';
import { AiAssistantDialog } from './AiAssistantDialog';

/**
 * Availability and open state for the docs assistant.
 *
 * Availability comes from values baked in at build time (the `env` block in `next.config.mjs`): a
 * static export has no API routes, and a build without `runtime.ai` has no chat route. The triggers
 * are gated on the same values, so such a build shows no affordance rather than one that fails.
 *
 * The header hides its controls below the `@2xl` container width, so the mobile nav needs a trigger
 * of its own. Both open the one dialog this provider renders, which is also what `⌘K` reaches.
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

/** Search-shaped header control, next to the MCP control. */
export function AiAssistantTrigger() {
  const assistant = useAiAssistant();
  if (!assistant) return null;

  return (
    <Button variant="outline" className="h-8 gap-2 px-3 text-muted-foreground" onClick={assistant.open} title="Ask the design system">
      <Search className="h-3.5 w-3.5" />
      <span className="text-sm">Search</span>
      <kbd className="ml-1 rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
    </Button>
  );
}

/**
 * The same control for the mobile nav. It must sit inside that nav's sheet: the assistant is a
 * dialog, so the sheet has to close as it opens rather than the two stacking and fighting over
 * focus.
 */
export function AiAssistantMobileTrigger() {
  const assistant = useAiAssistant();
  if (!assistant) return null;

  return (
    <SheetClose asChild>
      <Button variant="ghost" className="w-full justify-start font-normal" onClick={assistant.open}>
        <Search className="mr-2 h-4 w-4" />
        <span>Ask the design system</span>
      </Button>
    </SheetClose>
  );
}
