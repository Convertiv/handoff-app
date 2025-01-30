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

const humanReadableType = (type: string) => {
  switch (type) {
    case 'text':
      return 'Text fields are for adding simple text.  They can have length restrictions and validation rules.';
    case 'array':
      return 'Arrays are for adding multiple items or groups of items. They could be a list of text fields, or a list of complex objects. They have restrictions on the minimum and maximum number of items.';
    case 'object':
    default:
      return type;
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
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">{field.name}</p>
            <p className="font-mono text-xs">{humanReadableType(field.type)}</p>
          </div>
          <SheetDescription className="leading-relaxed">{field.description}</SheetDescription>
        </SheetHeader>
        <div className="px-2">
          <Separator className="mb-4 mt-6" />

          {field.rules && Object.keys(field.rules).map((rule) => <RuleDisplay key={rule} rule={rule} value={field.rules[rule]} />)}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const RuleDisplay: React.FC<{ rule: string; value: any }> = ({ rule, value }) => {
  return (
    <>
      <p className="mb-3 flex items-center gap-3">
        <SwatchBook className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
        <span className="text-sm font-normal">{startCase(rule)}</span>
      </p>
      <p className="text-sm text-muted-foreground"> {humanReadableRule(rule, value)}</p>
    </>
  );
};
export default RulesSheet;
