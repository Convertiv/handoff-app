import { Types as CoreTypes } from 'handoff-core';
import startCase from 'lodash/startCase';
import { ArrowRightToLine, Check, Copy, Link, SwatchBook } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import HeadersType from '../Typography/Headers';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Separator } from '../ui/separator';
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { hexToRgb } from '../util/colors';
import ColorContrast from './ColorContrast';
import ColorInfo from './ColorInfo';
import ColorSpaces from './ColorSpaces';
import ColorTailwind from './ColorTailwind';

type ColorGridProps = {
  title: string;
  group: string;
  description: string;
  colors: CoreTypes.IColorObject[];
};

const LargeColorGrid: React.FC<{ colors: CoreTypes.IColorObject[]; setOpen: (color) => void }> = ({ colors, setOpen }) => (
  <div className="@container">
    <div className="mb-6 grid grid-cols-1 gap-6 @md:grid-cols-2">
      {colors.map((color) => (
        <a href="#" className="flex flex-col items-start" key={color.group + '-' + color.name}>
          <div
            className="group relative mb-2 block h-32 w-full rounded-lg"
            style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
          >
            <ColorDropdown color={color} openSheet={setOpen} />
          </div>
          <p className="mb-1 text-sm font-medium line-clamp-1" title={color.name}>{color.name}</p>
          <small className="font-mono text-xs font-light text-gray-400 line-clamp-1" title={color.value}>{color.value}</small>
        </a>
      ))}
    </div>
  </div>
);

const SmallColorGrid: React.FC<{ colors: CoreTypes.IColorObject[]; setOpen: (color) => void }> = ({ colors, setOpen }) => {
  // group colors by subgroup
  const groupedColors = colors.reduce(
    (acc, color) => {
      if (!acc[color.subgroup]) {
        acc[color.subgroup] = [];
      }
      acc[color.subgroup].push(color);
      return acc;
    },
    {} as Record<string, CoreTypes.IColorObject[]>
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
                    className="group relative mb-2 block h-14 rounded-lg"
                    style={{ background: color.value ?? '', backgroundBlendMode: color.blend ?? '' }}
                  >
                    <ColorDropdown color={color} openSheet={setOpen} />
                  </div>
                  <p className="mb-1 text-xs font-medium line-clamp-1" title={color.name}>{color.name}</p>
                  <small className="font-mono text-xs font-light text-gray-400 line-clamp-1" title={color.value}>{color.value}</small>
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
    <div id={`${group}-colors`} className="scroll-mt-24 scroll-smooth pb-10">
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="mb-8">{description}</p>
      {colors.length < 5 ? <LargeColorGrid colors={colors} setOpen={openSheet} /> : <SmallColorGrid colors={colors} setOpen={openSheet} />}
      <ColorSheet color={selectedColor} open={open} setOpen={setOpen} />
    </div>
  );
};

const ColorDropdown: React.FC<{ color: CoreTypes.IColorObject; openSheet: (color) => void }> = ({ color, openSheet }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <div className="absolute right-1 top-1 flex cursor-pointer items-center justify-center rounded-sm bg-white p-[6px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

const ColorSheet: React.FC<{ color: CoreTypes.IColorObject; open: boolean; setOpen: (boolean) => void }> = ({ color, open, setOpen }) => {
  const [selectedColorSpace, setSelectedColorSpace] = React.useState('raw');
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
          <ColorInfo color={color} />
        </SheetHeader>
        <div className="px-2">
          <Separator className="mb-6 mt-6" />
          <ColorSpaces color={color} selectedColorSpace={selectedColorSpace} setSelectedColorSpace={setSelectedColorSpace} />
          <Separator className="mb-6 mt-6" />
          <ColorContrast color={color} />
          <Separator className="mb-6 mt-6" />
          <ColorTailwind />
        </div>
      </SheetContent>
    </Sheet>
  );
};
export default ColorGrid;
