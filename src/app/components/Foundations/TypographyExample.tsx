import { Separator } from '@radix-ui/react-select';
import { Types as CoreTypes } from 'handoff-core';
import { ArrowRightToLine, BookType, Check, Copy, Link, Type } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { typographyTypes } from '../../pages/foundations/typography';
import { anchorSlugify } from '../Navigation/AnchorNav';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type TypographyProps = {
  title: string;
  group: string;
  description: string;
  types: CoreTypes.ITypographyObject[];
};

export const pluckStyle = (type: CoreTypes.ITypographyObject) => {
  return {
    fontFamily: type.values.fontFamily,
    fontSize: type.values.fontSize,
    fontWeight: type.values.fontWeight,
    lineHeight: type.values.lineHeightPx + 'px',
  };
};

export const renderTypes: (type: CoreTypes.ITypographyObject, content: string) => typographyTypes = (
  type: CoreTypes.ITypographyObject,
  content: string
) => ({
  'Heading 1': <h1 style={pluckStyle(type)}>{content}</h1>,
  'Heading 2': <h2 style={pluckStyle(type)}>{content}</h2>,
  'Heading 3': <h3 style={pluckStyle(type)}>{content}</h3>,
  'Heading 4': <h4 style={pluckStyle(type)}>{content}</h4>,
  'Heading 5': <h5 style={pluckStyle(type)}>{content}</h5>,
  'Heading 6': <h6 style={pluckStyle(type)}>{content}</h6>,
  'Input Labels': <label style={pluckStyle(type)}>{content}</label>,
  Blockquote: <blockquote style={pluckStyle(type)}>{content}</blockquote>,
  Link: <a style={pluckStyle(type)}>{content}</a>,
  Paragraph: <p style={pluckStyle(type)}>{content}</p>,
});

const TypographyExamples: React.FC<{ types: CoreTypes.ITypographyObject[]; type_copy?: string }> = ({ types, type_copy }) => {
  const [openType, setOpenType] = React.useState(false);
  const [copy, setCopy] = React.useState('Copy link to clipboard');
  const [selectedType, setSelectedType] = React.useState<CoreTypes.ITypographyObject | undefined>(undefined);
  type_copy = type_copy ?? 'Almost before we knew it, we had left the ground.';
  const openTypeSheet = (type: CoreTypes.ITypographyObject) => {
    setSelectedType(type);
    setOpenType(true);
  };

  const categorizedTypes = types.reduce<{
    categorized: Record<string, CoreTypes.ITypographyObject[]>;
    uncategorized: CoreTypes.ITypographyObject[];
  }>(
    (acc, type) => {
      if (type.name.includes('/')) {
        const [categoryRaw] = type.name.split('/');
        const category = categoryRaw.trim();
        acc.categorized[category] = acc.categorized[category] ?? [];
        acc.categorized[category].push(type);
      } else {
        acc.uncategorized.push(type);
      }
      return acc;
    },
    { categorized: {}, uncategorized: [] }
  );

  const renderTypeCard = (type: CoreTypes.ITypographyObject, key: React.Key) => (
    <div key={key} className="border-t border-gray-200 dark:border-gray-800">
      <div className="group relative grid grid-cols-[200px_1fr] gap-4 py-7">
        <div className="absolute right-2 top-2 inline-flex items-center justify-center gap-0 rounded-md border border-input bg-background p-1 opacity-0 shadow-xs transition-opacity duration-500 group-hover:opacity-100">
          <button className="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Copy className="h-3 w-3 text-gray-500" />
          </button>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Link className="h-3 w-3 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">Copy Link</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => openTypeSheet(type)} className="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Type className="h-3 w-3 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">Text Info</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{type.name}</h3>
          <small className="text-xs text-gray-500">
            {type.values.fontFamily} <span className="px-[2px] text-[10px] text-gray-400">&bull;</span> {type.values.fontWeight}
          </small>
          <small className="text-xs text-gray-500">
            {type.values.fontSize}px <span className="px-[2px] align-middle text-[10px] text-gray-400">&bull;</span>{' '}
            {(type.values.lineHeightPx / type.values.fontSize).toFixed(1)}
          </small>
        </div>
        <div>{renderTypes(type, type_copy)[type.name] ?? <span style={pluckStyle(type)}>{type_copy}</span>}</div>
      </div>
    </div>
  );

  return (
    <>
      {categorizedTypes.uncategorized.map((type, index) => renderTypeCard(type, `type-uncategorized-${index}`))}
      <Accordion type="multiple" className="mt-4 space-y-2">
        {Object.entries(categorizedTypes.categorized).map(([category, categoryTypes]) => {
          const categoryAnchor = `typography-${anchorSlugify(category)}`;
          return (
            <AccordionItem
              key={`typography-category-${categoryAnchor}`}
              value={categoryAnchor}
              id={categoryAnchor}
              className="scroll-mt-24 py-1"
            >
              <AccordionTrigger className="px-0 text-sm font-semibold">
                <div>
                  {category} <span className="font-normal text-gray-500">({categoryTypes.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0">
                {categoryTypes.map((type, index) => renderTypeCard(type, `type-${categoryAnchor}-${index}`))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <TypographySheet type={selectedType} openType={openType} setOpenType={setOpenType} />
    </>
  );
};

const TypographySheet: React.FC<{ type: CoreTypes.ITypographyObject; openType: boolean; setOpenType: (boolean) => void }> = ({
  type,
  openType,
  setOpenType,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState('off');
  const handleCopy = () => {
    navigator.clipboard.writeText('https://' + window.location.host + window.location.pathname + '#' + type.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (!type) return null;
  return (
    <Sheet open={openType} onOpenChange={setOpenType}>
      <SheetContent className="w-[400px] overflow-auto sm:w-[540px]  [&>button:hover]:opacity-0 [&>button]:opacity-0">
        <SheetHeader className="space-y-2 px-2">
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
          <div className="mb-2 flex h-48 w-full items-center justify-center rounded-md bg-gray-50">
            {<span style={pluckStyle(type)}>Ag</span>}
          </div>
          <SheetTitle>{type.name}</SheetTitle>
          <SheetDescription className="leading-relaxed">
            Description from Figma, usually usage guideline like &quot;Use for background&quot; or &quot;Use for text&quot;.
          </SheetDescription>
          <div className="mt-2 flex items-center gap-2 pt-3">
            <svg className="h-2.5 w-2.5 text-slate-700" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <title>Figma</title>
              <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
            </svg>
            <Breadcrumb>
              <BreadcrumbList className="text-xs text-gray-500">
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-500">Primitives</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-500">Text</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-500">Heading</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="px-2">
          <p className="mb-3 flex items-center gap-3">
            <BookType className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
            <span className="text-sm font-normal">Style Details</span>
          </p>
          <ul className="flex flex-col gap-3">
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-xs">
              <p className="font-mono text-xs text-gray-400">Font Size</p>
              <p className="font-mono text-xs">{type.values.fontSize}px</p>
            </li>
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-xs">
              <p className="font-mono text-xs text-gray-400">Line Height</p>
              <p className="font-mono text-xs">{(type.values.lineHeightPx / type.values.fontSize).toFixed(1)}</p>
            </li>
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-xs">
              <p className="font-mono text-xs text-gray-400">Font Family</p>
              <p className="font-mono text-xs">{type.values.fontFamily}</p>
            </li>
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-xs">
              <p className="font-mono text-xs text-gray-400">Font Weight</p>
              <p className="font-mono text-xs">{type.values.fontWeight}</p>
            </li>
          </ul>
          <div className="flex hidden justify-end">
            <div className="mt-3 inline-flex h-7 rounded-lg bg-input/50 p-0.5">
              <RadioGroup
                value={selectedValue}
                onValueChange={setSelectedValue}
                className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-xs font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-xs after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:outline-solid has-focus-visible:after:outline-2 has-focus-visible:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
                data-state={selectedValue}
              >
                <label className="relative z-10 inline-flex h-full min-w-6 cursor-pointer select-none items-center justify-center whitespace-nowrap px-3 transition-colors group-data-[state=on]:text-muted-foreground/70">
                  Raw Value
                  <RadioGroupItem value="off" className="sr-only" />
                </label>
                <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70">
                  <span>CSS</span>
                  <RadioGroupItem value="on" className="sr-only" />
                </label>
              </RadioGroup>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
export default TypographyExamples;
