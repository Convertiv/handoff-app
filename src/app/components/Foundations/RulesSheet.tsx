import { SlotMetadata } from '@handoff/transformers/preview/component';
import { startCase } from 'lodash';
import { ArrowRightToLine, Check, CircleCheck, File, Image, Link, MoveHorizontal, SwatchBook } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
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
      return `Use a minimum size of ${value.min.width}x${value.min.height} and a maximum size of ${value.max.width}x${value.max.height}`;
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

const getVariantForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'text':
      return 'green';
    case 'image':
      return 'info';
    case 'video_file':
    case 'video_embed':
      return 'warning';
    default:
      return 'default';
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
  const onOpenChange = (open) => {
    if (!open) {
      history.pushState ? history.replaceState(null, null, document.location.pathname + '') : (location.hash = `#`);
    }
    setOpen(open);
  };
  if (!field) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
          {field.type === 'image' && (
            <div className="flex h-[200px] items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
              <p>
                {field.rules?.dimensions
                  ? `${field.rules.dimensions.min.width}x${field.rules.dimensions.min.height} - ${field.rules.dimensions.max.width}x${field.rules.dimensions.max.height}`
                  : 'No dimensions specified'}
              </p>
              <Image className="pointer-events-none absolute h-[100px] w-[100px] stroke-1 opacity-5" />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">{field.name}</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-muted-foreground">{field.id}</p>
            </div>
          </div>
          <Separator className="mb-4! mt-6" />
          <SheetDescription className="leading-relaxed">{field.description}</SheetDescription>
          {/* <p className="font-mono text-xs">
            This is a {field.type} field. {humanReadableType(field.type)}
          </p> */}
        </SheetHeader>
        <div className="px-2">
          <Separator className="mb-4 mt-6" />
          <ul className="mb-10 flex flex-col gap-2">
            <li className="flex w-full justify-between py-1">
              <div className="flex items-center gap-3">
                <File className="h-3.5 w-3.5 stroke-2 opacity-60" />
                <p className="text-[13px]">Type</p>
              </div>
              <Badge variant={getVariantForType(field.type)} className="rounded-xl px-2.5">
                {field.type}
              </Badge>
            </li>
            <li className="flex w-full justify-between py-1">
              <div className="flex items-center gap-3">
                <MoveHorizontal className="h-3.5 w-3.5 stroke-2 opacity-60" />
                <p className="text-[13px]">Size</p>
              </div>
              <div>
                <p className="font-mono text-xs text-gray-400">
                  {field.rules?.content?.min || '-'} - {field.rules?.content?.max || '-'}
                </p>
              </div>
            </li>
            <li className="flex w-full justify-between py-1">
              <div className="flex items-center gap-3">
                <CircleCheck className="h-3.5 w-3.5 stroke-2 opacity-60" />
                <p className="text-[13px]">Required</p>
              </div>
              <div>
                <p className="font-mono text-xs text-gray-400">{field.rules?.required ? 'Required' : 'Optional'}</p>
              </div>
            </li>
          </ul>

          {field.rules && Object.keys(field.rules).map((rule) => <RuleDisplay key={rule} rule={rule} value={field.rules[rule]} />)}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const RuleDisplay: React.FC<{ rule: string; value: any }> = ({ rule, value }) => {
  return (
    <>
      <p className="flex items-center gap-3">
        <SwatchBook className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
        <span className="text-sm font-normal">{startCase(rule)}</span>
      </p>
      <p className="mb-3 text-sm text-muted-foreground "> {humanReadableRule(rule, value)}</p>
    </>
  );
};
export default RulesSheet;
