import { Types as CoreTypes } from 'handoff-core';
import { SwatchBook } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils';
import CopyToClipboard from '../CopyToClipboard';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { hexToRgb, hexToRgbaCss } from '../util/colors';

type ColorSpacesProps = {
  color: CoreTypes.IColorObject;
  selectedColorSpace: string;
  setSelectedColorSpace: (value: string) => void;
};



const ColorSpaces: React.FC<ColorSpacesProps> = ({ color, selectedColorSpace, setSelectedColorSpace }) => {
  if (!color) {
    return null;
  }

  return (
    <>
      <p className="mb-4 flex items-center gap-2">
        <SwatchBook className="h-[14px] w-[14px] text-slate-600 opacity-70" strokeWidth={1.5} />
        <span className="text-sm font-medium text-neutral-900">Color Spaces</span>
      </p>
      <ul className="flex flex-col gap-3">
        <li className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
          <p className="font-mono text-xs text-gray-400">HEX</p>
          <div className="relative flex items-end gap-2">
            <p
              className={cn(
                'duration-300 absolute right-6 font-mono text-xs transition-all',
                selectedColorSpace === 'css' ? 'translate-y-0 opacity-100 rotate-x-0' : 'translate-y-2 opacity-0 rotate-x-90'
              )}
            >
              {color.value}
            </p>
            <p
              className={cn(
                'duration-300 font-mono text-xs transition-all',
                selectedColorSpace === 'raw' ? 'translate-y-0 opacity-100 rotate-x-0' : 'translate-y-[-10px] opacity-0 rotate-x-90'
              )}
            >
              {color.value}
            </p>
            <CopyToClipboard value={color.value} tooltip="Click to copy" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400 bg-transparent shadow-none" />
          </div>
        </li>
        <li className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
          <p className="font-mono text-xs text-gray-400">RGB</p>
          <div className="relative flex items-end gap-2">
            <p
              className={cn(
                'duration-300 absolute right-6 font-mono text-xs transition-all',
                selectedColorSpace === 'css' ? 'translate-y-0 opacity-100 rotate-x-0' : 'translate-y-2 opacity-0 rotate-x-90'
              )}
            >
              {hexToRgbaCss(color.value)}
            </p>
            <p
              className={cn(
                'duration-300 font-mono text-xs transition-all',
                selectedColorSpace === 'raw' ? 'translate-y-0 opacity-100 rotate-x-0' : 'translate-y-[-10px] opacity-0 rotate-x-90'
              )}
            >
              {hexToRgb(color.value)}
            </p>
            <CopyToClipboard value={selectedColorSpace === 'css' ? hexToRgbaCss(color.value) : hexToRgb(color.value)} tooltip="Click to copy" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400  bg-transparent shadow-none" />
          </div>
        </li>
        <li className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
          <p className="font-mono text-xs text-gray-400">OKLCH</p>
          <div className="relative flex items-end gap-2">
            <p 
              className={cn(
                  'duration-300 absolute right-6 font-mono text-xs transition-all',
                  selectedColorSpace === 'css' ? 'translate-y-0 opacity-100 rotate-x-0' : 'translate-y-2 opacity-0 rotate-x-90'
              )}>
              oklch(49% 0.50 273)
            </p>
            <p 
              className={cn(
                  'duration-300 font-mono text-xs transition-all',
                  selectedColorSpace === 'raw' ? 'translate-y-0 opacity-100 rotate-x-0' : 'translate-y-[-10px] opacity-0 rotate-x-90'
              )}>
              0.49 0.50 273
            </p>
            <CopyToClipboard value={selectedColorSpace === 'css' ? 'oklch(49% 0.50 273)' : '0.49 0.50 273'} tooltip="Click to copy" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400 bg-transparent shadow-none" />
          </div>
        </li>
      </ul>
      <div className="flex justify-end">
        <div className="mt-3 inline-flex h-7 rounded-lg bg-input/50 p-0.5">
          <RadioGroup
            value={selectedColorSpace}
            onValueChange={setSelectedColorSpace}
            className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-xs font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-xs after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:outline-solid has-focus-visible:after:outline-2 has-focus-visible:after:outline-ring/70 data-[state=raw]:after:translate-x-0 data-[state=css]:after:translate-x-full"
            data-state={selectedColorSpace}
          >
            <label className="relative z-10 inline-flex h-full min-w-6 cursor-pointer select-none items-center justify-center whitespace-nowrap px-3 transition-colors group-data-[state=css]:text-muted-foreground/70">
              Raw Value
              <RadioGroupItem value="raw" className="sr-only" />
            </label>
            <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=raw]:text-muted-foreground/70">
              <span>CSS</span>
              <RadioGroupItem value="css" className="sr-only" />
            </label>
          </RadioGroup>
        </div>
      </div>
    </>
  );
};

export default ColorSpaces;

