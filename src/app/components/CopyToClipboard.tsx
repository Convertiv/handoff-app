import { CheckIcon, CopyIcon } from 'lucide-react';
import React from 'react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type CopyToClipboardProps = {
  value: string;
  tooltip: string;
  className?: string;
};

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ value, tooltip, className }) => {
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

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn('disabled:opacity-100', className)}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            disabled={copied}
          >
            <div
              className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}
            >
              <CheckIcon className="stroke-gray-600" size={16} aria-hidden="true" />
            </div>
            <div
              className={cn(
                'absolute transition-all',
                copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
              )}
            >
              <CopyIcon aria-hidden="true" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CopyToClipboard;

