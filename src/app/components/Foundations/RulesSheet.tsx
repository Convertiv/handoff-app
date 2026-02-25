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
      return `Contents should be at least ${value.min} and at most ${value.max} ${type} long`;
    case 'minValue':
      return 'This field must be at least ' + value;
    case 'maxValue':
      return 'This field must be at most ' + value;
    case 'pattern':
      return 'This field must match the pattern ' + value;
    case 'dimensions':
      if (!value?.min || !value?.max) return 'Dimensions not fully specified';
      return `Use a minimum size of ${value.min.width}x${value.min.height} and a maximum size of ${value.max.width}x${value.max.height}`;
    case 'maxSize':
    case 'filesize':
      if (value < 1024) {
        return `This field must be at most ${value} bytes`;
      }
      if (value < 1024 * 1024) {
        return `This field must be at most ${Math.floor(value / 1024)} KB`;
      }
      return `This field must be at most ${Math.floor(value / (1024 * 1024))} MB`;
    case 'filetype':
      return `Accepted file type: ${value}`;
    case 'minItems':
      return `At least ${value} item(s) required`;
    case 'maxItems':
      return `At most ${value} item(s) allowed`;
    case 'enum':
      return 'Enumeration';
    default:
      return rule;
  }
};

const humanReadableType = (type: string) => {
  switch (type) {
    case 'text':
    case 'string':
      return 'Text fields are for adding simple text. They can have length restrictions and validation rules.';
    case 'richtext':
      return 'Rich text fields support formatted HTML content like bold, italic, links, and lists.';
    case 'number':
      return 'Number fields accept numeric values.';
    case 'boolean':
      return 'Boolean fields are toggles that can be true or false.';
    case 'color':
      return 'Color fields accept color values such as hex, RGB, or HSL strings.';
    case 'select':
    case 'enum':
      return 'Select fields allow choosing from a predefined list of options.';
    case 'image':
      return 'Image fields store image data with a source URL and alt text. They can have dimension and file size restrictions.';
    case 'link':
      return 'Link fields store a label and URL. They represent navigational elements.';
    case 'button':
      return 'Button fields store a label, URL, and optional variant. They represent interactive call-to-action elements.';
    case 'video':
      return 'Video fields store a source URL and optional poster image. They can have file size and type restrictions.';
    case 'array':
      return 'Arrays contain multiple items or groups of items. They can have restrictions on the minimum and maximum number of items.';
    case 'object':
      return 'Objects contain a set of named sub-properties, each with its own type and rules.';
    default:
      return type;
  }
};

const getVariantForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'text':
    case 'string':
    case 'richtext':
      return 'green';
    case 'image':
      return 'info';
    case 'link':
    case 'button':
      return 'purple';
    case 'video':
    case 'video_file':
    case 'video_embed':
      return 'warning';
    case 'select':
    case 'enum':
      return 'orange';
    case 'color':
      return 'pink';
    case 'number':
    case 'boolean':
      return 'secondary';
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
  const typeLabel = field.deepType?.display || field.docgenType || field.type;
  const hasDescription = !!field.description?.trim();
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
          {hasDescription ? (
            <>
              <Separator className="mb-4! mt-5" />
              <SheetDescription className="leading-relaxed">{field.description}</SheetDescription>
            </>
          ) : null}
          {/* <p className="font-mono text-xs">
            This is a {field.type} field. {humanReadableType(field.type)}
          </p> */}
        </SheetHeader>
        <div className="px-2">
          <Separator className={hasDescription ? 'mb-4 mt-5' : 'mb-4 mt-3'} />
          <ul className="mb-10 flex flex-col gap-2">
            <li className="flex w-full justify-between py-1">
              <div className="flex items-center gap-3">
                <File className="h-3.5 w-3.5 stroke-2 opacity-60" />
                <p className="text-[13px]">Type</p>
              </div>
              <Badge variant={getVariantForType(field.type)} className="rounded-xl px-2.5">
                {typeLabel}
              </Badge>
            </li>
            {(field.type === 'text' || field.type === 'string' || field.type === 'richtext') && (
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
            )}
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

          {/* Select/enum options */}
          {(field.type === 'select' || field.type === 'enum') && (field as any).options && (
            <>
              <Separator className="mb-4" />
              <p className="mb-2 text-sm font-medium">Options</p>
              <div className="mb-6 flex flex-wrap gap-1.5">
                {((field as any).options as any[]).map((opt, i) => (
                  <Badge key={i} variant="outline" className="rounded-md px-2 py-0.5 text-xs">
                    {typeof opt === 'string' ? opt : opt.label}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {/* Array item count rules */}
          {field.type === 'array' && (field.rules?.minItems !== undefined || field.rules?.maxItems !== undefined) && (
            <>
              <Separator className="mb-4" />
              <p className="mb-2 text-sm font-medium">Item Count</p>
              <p className="mb-6 text-xs text-muted-foreground">
                {field.rules?.minItems !== undefined && `Min: ${field.rules.minItems}`}
                {field.rules?.minItems !== undefined && field.rules?.maxItems !== undefined && ' / '}
                {field.rules?.maxItems !== undefined && `Max: ${field.rules.maxItems}`}
              </p>
            </>
          )}

          {field.rules && (
            <>
              <Separator className="mb-4" />
              <p className="mb-2 text-sm font-medium">Rules</p>
              {Object.keys(field.rules).map((rule) => <RuleDisplay key={rule} rule={rule} value={field.rules[rule]} />)}
            </>
          )}
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
