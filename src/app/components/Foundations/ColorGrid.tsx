import { cn } from '@/lib/utils';
import { ColorObject } from '@handoff/api';
import startCase from 'lodash/startCase';
import { ArrowRightToLine, Check, Contrast, Copy, Link, SwatchBook } from 'lucide-react';
import React from 'react';
import HeadersType from '../Typography/Headers';
import { Badge } from '../ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
type ColorGridProps = {
  title: string;
  group: string;
  description: string;
  colors: ColorObject[];
};

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `Red: ${parseInt(result[1], 16)}, Green: ${parseInt(result[2], 16)}, Blue: ${parseInt(result[3], 16)}` : null;
}

const LargeColorGrid: React.FC<{ colors: ColorObject[]; setOpen: (color) => void }> = ({ colors, setOpen }) => (
  <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,300px))] gap-6">
    {colors.map((color) => (
      <a href="#" className="flex flex-col items-start" key={color.group + '-' + color.name}>
        <div
          className="group relative mb-2 block h-32 w-full rounded-lg"
          style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
        >
          <ColorDropdown color={color} openSheet={setOpen} />
        </div>
        <p className="mb-1 text-sm font-medium">{color.name}</p>
        <small className="font-mono text-xs font-light text-gray-400">{color.value}</small>
      </a>
    ))}
  </div>
);

const SmallColorGrid: React.FC<{ colors: ColorObject[]; setOpen: (color) => void }> = ({ colors, setOpen }) => {
  // group colors by subgroup
  const groupedColors = colors.reduce(
    (acc, color) => {
      if (!acc[color.subgroup]) {
        acc[color.subgroup] = [];
      }
      acc[color.subgroup].push(color);
      return acc;
    },
    {} as Record<string, ColorObject[]>
  );
  return (
    <>
      {Object.entries(groupedColors).map(([subgroup]) => (
        <div className="mb-5" key={`group-${subgroup}`}>
          <HeadersType.H4 key={subgroup}>{startCase(subgroup.replaceAll('-', ' '))}</HeadersType.H4>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(60px,60px))] gap-6">
            {groupedColors[subgroup].map((color) => (
              <React.Fragment key={`group-${subgroup}-${color.name}`}>
                <a href="" className="flex flex-col">
                  <div
                    className="group relative  mb-2 block h-14 rounded-lg"
                    style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
                  >
                    <ColorDropdown color={color} openSheet={setOpen} />
                  </div>
                  <p className="mb-1 text-sm font-medium">{color.name}</p>
                  <small className="font-mono text-xs font-light text-gray-400">{color.value}</small>
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

const ColorGrid: React.FC<ColorGridProps> = ({ title, description, colors, group }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState(null);
  const openSheet = (color) => {
    setSelectedColor(color);
    setOpen(true);
  };
  return (
    <>
      <h3 className="mb-2 text-lg font-medium" id={`${group}-colors`}>
        {title}
      </h3>
      <p className="mb-8">{description}</p>
      {colors.length < 5 ? <LargeColorGrid colors={colors} setOpen={openSheet} /> : <SmallColorGrid colors={colors} setOpen={openSheet} />}
      <ColorSheet color={selectedColor} open={open} setOpen={setOpen} />
    </>
  );
};

const ColorDropdown: React.FC<{ color: ColorObject; openSheet: (color) => void }> = ({ color, openSheet }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <div className="absolute right-1 top-1 flex cursor-pointer items-center justify-center rounded-sm bg-white/100 p-[6px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="inline-block h-[3px] w-[3px] rounded-full bg-black"></span>
        <span className="mx-[2px] inline-block h-[3px] w-[3px] rounded-full bg-black"></span>
        <span className="inline-block h-[3px] w-[3px] rounded-full bg-black"></span>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-60">
      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(color.name)}>
        <Copy className="text-gray-400" /> Name
        <DropdownMenuShortcut className="max-w-[100px] truncate">{color.name}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(color.value)}>
        <Copy className="text-gray-400" /> HEX
        <DropdownMenuShortcut className="max-w-[100px] truncate">{color.value}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigator.clipboard.writeText('rgba(0, 49, 82, 1)')}>
        <Copy className="text-gray-400" /> RGBA
        <DropdownMenuShortcut className="max-w-[100px] truncate">{hexToRgb(color.value)}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => openSheet(color)} className="truncate">
        <SwatchBook className="text-gray-400" />
        Color Info
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const ColorSheet: React.FC<{ color: ColorObject; open: boolean; setOpen: (boolean) => void }> = ({ color, open, setOpen }) => {
  const [selectedValue, setSelectedValue] = React.useState('off');
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(color.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (!color) return null;
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
          <div className={`relative mb-2 block h-32 w-full rounded-md`} style={{ background: color.value }}>
            <div className="absolute bottom-0 left-0 flex flex-col gap-0.5 px-4 py-4">
              <p className="font-medium text-white">{color.name}</p>
              <p className="font-mono text-xs text-white">{color.value}</p>
            </div>
          </div>
          <SheetDescription className="leading-relaxed">
            Color description coming from Figma variable or style description. Usually usage guideline like &quot;Use for background&quot;
            or &quot;Use for text&quot;.
          </SheetDescription>
          <div className="mt-2 flex items-center gap-2">
            <svg className="h-2.5 w-2.5 text-slate-700" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <title>Figma</title>
              <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
            </svg>
            <Breadcrumb>
              <BreadcrumbList className="text-xs text-gray-500">
                {color.groups.map((group, index) => (
                  <BreadcrumbItem key={group}>
                    <BreadcrumbPage className="text-gray-500">{group}</BreadcrumbPage>
                    {color.groups.length - 1 !== index && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </SheetHeader>
        <div className="px-2">
          <Separator className="mb-4 mt-6" />
          <p className="mb-3 flex items-center gap-3">
            <SwatchBook className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
            <span className="text-sm font-normal">Color Spaces</span>
          </p>
          <ul className="flex flex-col gap-3">
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-sm">
              <p className="font-mono text-xs text-gray-400">HEX</p>
              <div className="relative">
                <p
                  className={cn(
                    'duration-400 absolute font-mono text-xs transition-[filter,transform,opacity]',
                    selectedValue === 'on' ? 'translate-y-0 opacity-100 blur-none' : 'translate-y-2 opacity-0 blur-sm'
                  )}
                >
                  {color.value}
                </p>
                <p
                  className={cn(
                    'duration-400 font-mono text-xs transition-[filter,transform,opacity]',
                    selectedValue === 'off' ? 'translate-y-0 opacity-100 blur-none' : 'translate-y-[-20px] opacity-0 blur-sm'
                  )}
                >
                  {color.value}
                </p>
              </div>
            </li>
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-sm">
              <p className="font-mono text-xs text-gray-400">RGB</p>
              <div className="relative">
                <p
                  className={cn(
                    'duration-400 absolute font-mono text-xs transition-[filter,transform,opacity]',
                    selectedValue === 'on' ? 'translate-y-0 opacity-100 blur-none' : 'translate-y-2 opacity-0 blur-sm'
                  )}
                >
                  {hexToRgb(color.value)}
                </p>
                <p
                  className={cn(
                    'duration-400 font-mono text-xs transition-[filter,transform,opacity]',
                    selectedValue === 'off' ? 'translate-y-0 opacity-100 blur-none' : 'translate-y-[-20px] opacity-0 blur-sm'
                  )}
                >
                  {hexToRgb(color.value)}
                </p>
              </div>
            </li>
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-sm">
              <p className="font-mono text-xs text-gray-400">HSL</p>
              <p className="font-mono text-xs">{selectedValue === 'on' ? 'hsl(210deg, 100%, 40%)' : '210°, 100%, 40%'}</p>
            </li>
            <li className="flex w-full justify-between rounded-md border border-input border-t-[#f3f3f3] bg-gray-100 bg-transparent px-4 py-2 shadow-sm">
              <p className="font-mono text-xs text-gray-400">LCH</p>
              <p className="font-mono text-xs">{selectedValue === 'on' ? 'lch(49 50 273)' : '49, 50, 273'}</p>
            </li>
          </ul>
          <div className="flex justify-end">
            <div className="mt-3 inline-flex h-7 rounded-lg bg-input/50 p-0.5">
              <RadioGroup
                value={selectedValue}
                onValueChange={setSelectedValue}
                className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-xs font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
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
          <Separator className="mb-4 mt-6" />
          <p className="mb-3 flex items-center gap-3">
            <Contrast className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
            <span className="text-sm font-normal">Contrast</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-input bg-transparent p-4">
              <p className="mb-3 text-xs font-medium">Small Text</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">4.5:1</Badge>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="green">7.2:1</Badge>
                <span className="text-xs text-gray-500">Current</span>
              </div>
            </div>
            <div className="rounded-md border border-input bg-transparent p-4">
              <p className="mb-3 text-xs font-medium">Large Text</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">3:1</Badge>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="green">7.2:1</Badge>
                <span className="text-xs text-gray-500">Current</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
export default ColorGrid;
