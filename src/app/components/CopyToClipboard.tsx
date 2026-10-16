import { CheckIcon, CopyIcon } from 'lucide-react';
import React from 'react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type CopyToClipboardProps = {
  value: string;
  /** Accessible name for the control, and the hover tooltip unless `showTooltip` is off. */
  tooltip: string;
  /** Hide the tooltip where the surrounding UI already says what the button copies. */
  showTooltip?: boolean;
  className?: string;
};

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ value, tooltip, showTooltip = true, className }) => {
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const button = (
    <Button
      variant="outline"
      size="icon"
      className={cn('disabled:opacity-100', className)}
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : tooltip}
      disabled={copied}
    >
      <div className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
        <CheckIcon className="stroke-gray-600" size={16} aria-hidden="true" />
      </div>
      <div className={cn('absolute transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
        <CopyIcon aria-hidden="true" />
      </div>
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CopyToClipboard;
