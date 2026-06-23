'use client';
import { CheckIcon, CopyIcon, Download } from 'lucide-react';
import React from 'react';

import type { RuntimeMode } from '@handoff/types/config';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type RegistryEntityType = 'component' | 'pattern';

interface RegistryActionsProps {
  /** Resolved runtime mode projected to the client. */
  mode: RuntimeMode;
  /** Whether this is a connected workspace (workspace mode + resolvable registry URL). */
  connected: boolean;
  /** The kind of entity the page documents. */
  entityType: RegistryEntityType;
  /** Stable id of the component/pattern, used in the copyable command. */
  id: string;
}

type RegistryAction = {
  label: string;
  title: string;
  description: React.ReactNode;
  command: string;
};

/**
 * Registry transfer affordance for the single component/pattern page. Surfaces a context-appropriate
 * helper based on the runtime:
 * - registry mode -> "Checkout" instructions (pull the entity into a connected workspace);
 * - connected workspace (workspace mode + registry URL) -> "Publish" instructions.
 *
 * A static export is never a live runtime, so the publish affordance is suppressed there using the
 * same `HANDOFF_BUILD_TARGET` gate the runtime-mode badge uses. Renders nothing when no action
 * applies (e.g. a plain, unconnected workspace).
 */
export const RegistryActions: React.FC<RegistryActionsProps> = ({ mode, connected, entityType, id }) => {
  // The static export is a frozen snapshot, not a live workspace, so the publish hint carries no
  // meaning there and is omitted (mirrors the runtime-mode badge in the header).
  const isStaticSnapshot = process.env.HANDOFF_BUILD_TARGET === 'static';

  const action = resolveAction({ mode, connected, entityType, id, isStaticSnapshot });
  if (!action) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="font-normal [&_svg]:size-3!">
          <Download aria-hidden="true" />
          {action.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Download className="size-4 text-gray-700 dark:text-gray-200" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{action.title}</p>
          </div>
          <p className="text-sm text-muted-foreground">{action.description}</p>
          <div className="border-t" />
          <div className="flex items-stretch overflow-hidden rounded-md border">
            <code className="flex flex-1 items-center truncate px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
              {action.command}
            </code>
            <CopyCommandButton command={action.command} />
          </div>
          <p className="text-xs text-muted-foreground">Requires a workspace configured with registry access.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Copy-to-clipboard control for the command box. No tooltip — just a copy/checkmark toggle. */
const CopyCommandButton: React.FC<{ command: string }> = ({ command }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy command: ', err);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy command'}
      className="relative h-auto w-9 self-stretch rounded-none border-0 border-l shadow-none"
    >
      <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
        <CheckIcon className="stroke-gray-600" size={16} aria-hidden="true" />
      </span>
      <span className={cn('absolute transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
        <CopyIcon size={16} aria-hidden="true" />
      </span>
    </Button>
  );
};

const resolveAction = ({
  mode,
  connected,
  entityType,
  id,
  isStaticSnapshot,
}: RegistryActionsProps & { isStaticSnapshot: boolean }): RegistryAction | null => {
  if (mode === 'registry') {
    return {
      label: 'Checkout',
      title: `Checkout ${entityType}`,
      description: (
        <>
          Run this in a connected workspace to pull <strong className="font-medium text-foreground">{id}</strong> from the
          registry.
        </>
      ),
      command: `npm run checkout -- ${entityType} ${id}`,
    };
  }

  if (mode === 'workspace' && connected && !isStaticSnapshot) {
    return {
      label: 'Publish',
      title: `Publish ${entityType}`,
      description: (
        <>
          Run this in your connected workspace to publish <strong className="font-medium text-foreground">{id}</strong> to
          the registry.
        </>
      ),
      command: `npm run publish -- ${entityType} ${id}`,
    };
  }

  return null;
};

export default RegistryActions;
