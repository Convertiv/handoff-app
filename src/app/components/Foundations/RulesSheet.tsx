import { SlotMetadata } from '@handoff/transformers/preview/component';
import { startCase } from 'lodash';
import { ArrowRightToLine, Check, Link, SwatchBook } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

  const humanReadableRule = (rule: string, value: any) => {
    switch (rule) {
      case 'required':
        return value ? 'Required' : 'Optional';
      case 'content':
        let type = 'characters';
        if (value.type) {
          type = value.type;
        }
        return `Contents should at least ${value.min} and at most ${value.max} ${type} long`;
      case 'minValue':
        return 'This field must be at least ' + value;
      case 'maxValue':
        return 'This field must be at most ' + value;
      case 'pattern':
        return 'This field must match the pattern ' + value;
      case 'dimensions':
        return `Use a minimum size of ${value.minW}x${value.minHeight} and a maximum size of ${value.maxWidth}x${value.maxHeight}`;
      case 'maxSize':
        // translate to human readable byte size
        if (value < 1024) {
          return `This field must be at most ${value} bytes`;
        }
        if (value < 1024 * 1024) {
          return `This field must be at most ${Math.floor(value / 1024)} KB`;
        }
        return `This field must be at most ${Math.floor(value / (1024 * 1024))} MB`;
      case 'enum':
        return 'Enumeration';
      default:
        return rule;
    }
  };


const RulesSheet: React.FC<{ field: SlotMetadata; open: boolean; setOpen: (boolean) => void }> = ({ field, open, setOpen }) => {
  const [selectedValue, setSelectedValue] = React.useState('off');
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText('rule');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (!field) return null;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[400px] overflow-auto sm:w-[540px] [&>button:hover]:opacity-0 [&>button]:opacity-0">
        <div className="-mt-1 px-2">
          <div className="mb-4 flex justify-between">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 disabled:opacity-100 [&_svg]:size-3"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy Link'}
                    disabled={copied}
                  >
                    <div className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
                      <Check className="stroke-emerald-500" size={12} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className={cn('absolute transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
                      <Link size={12} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="px-2 py-1 text-xs">Copy Link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SheetClose asChild>
              <Button variant="outline" size="sm" className="h-7 [&_svg]:size-3">
                <ArrowRightToLine />
              </Button>
            </SheetClose>
          </div>
        </div>
        <SheetHeader className="space-y-2 px-2">
          <div className={`relative mb-2 block h-32 w-full rounded-md`}>
            <div className="absolute bottom-0 left-0 flex flex-col gap-0.5 px-4 py-4">
              <p className="font-medium text-white">{field.name}</p>
              <p className="font-mono text-xs text-white">{field.type}</p>
            </div>
          </div>
          <SheetDescription className="leading-relaxed">
            {field.description}
          </SheetDescription>
          <div className="mt-2 flex items-center gap-2">
            <svg className="h-2.5 w-2.5 text-slate-700" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <title>Figma</title>
              <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
            </svg>
          </div>
        </SheetHeader>
        <div className="px-2">
          <Separator className="mb-4 mt-6" />

                        {field.rules &&
                          Object.keys(field.rules).map((rule) => (
                            <>
<p className="mb-3 flex items-center gap-3">
            <SwatchBook className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
            <span className="text-sm font-normal">{startCase(rule)}</span>
            
          </p><p className="text-sm text-muted-foreground"> {humanReadableRule(rule, field.rules[rule])}</p></>

                          ))}

        </div>
      </SheetContent>
    </Sheet>
  );
};
export default RulesSheet;
