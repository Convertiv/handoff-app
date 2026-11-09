import { Check, Copy, Download } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export interface CopyCodeProps {
  code: string;
}

/**
 * A small icon button that copies `code`, then shows an emerald check for two seconds; the copy icon
 * and the check cross-fade into each other.
 *
 * Radix closes a tooltip when its trigger is pressed, so the tooltip is held open while the check
 * shows. Otherwise "Copied" would close as soon as it appears.
 */
export const CopyCode: React.FC<CopyCodeProps> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const reset = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(reset.current), []);
  const label = copied ? 'Copied' : 'Copy code';

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={hovered || copied} onOpenChange={setHovered}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            // Matches the preview toolbar's buttons. Not the ghost variant's `bg-accent` hover, which in
            // light mode is the same grey as the code surface.
            className="relative h-7 px-2.5 hover:bg-white hover:shadow-xs dark:hover:bg-neutral-700 [&_svg]:size-3"
            aria-label={label}
            onClick={() => {
              navigator.clipboard
                .writeText(code)
                .then(() => {
                  setCopied(true);
                  clearTimeout(reset.current);
                  reset.current = setTimeout(() => setCopied(false), 2000);
                })
                // A denied clipboard write leaves the button as it was: no check, no error.
                .catch(() => undefined);
            }}
          >
            <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
              <Check className="stroke-emerald-500" aria-hidden="true" />
            </span>
            <span className={cn('absolute transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
              <Copy aria-hidden="true" />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8} className="rounded-sm px-2 py-1 text-[11px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export interface DownloadCodeProps {
  code: string;
  filename: string;
}

export const DownloadCode: React.FC<DownloadCodeProps> = ({ code, filename }) => {
  const [download, setDownload] = React.useState('Download code as file');

  return (
    <Button variant="ghost" asChild>
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(code)}
        className="c-code-block__button c-tooltip"
        data-tooltip={download}
        data-download-state="download"
        onMouseEnter={(e) => setDownload('Download code as file')}
      >
        <Download />
      </a>
    </Button>
  );
};

export default CopyCode;
