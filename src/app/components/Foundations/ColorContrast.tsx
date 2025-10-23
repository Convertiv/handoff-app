import { Types as CoreTypes } from 'handoff-core';
import React from 'react';

import { Blend } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { calculateContrastRatio } from '../util/colors';

type ColorContrastProps = {
  color: CoreTypes.IColorObject;
};

const ColorContrast: React.FC<ColorContrastProps> = ({ color }) => {
  if (!color) {
    return null;
  }
  const contrast = calculateContrastRatio(color.value, '#FFFFFF');
  const contrastDisplay = contrast.toFixed(1);
  const contrastValue = Number(contrastDisplay);
  const getBarWidthPercentage = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return '0%';
    }
    const clampedValue = Math.min(Math.max(value, 0), 14);
    const percent = (clampedValue / 14) * 100;
    return `${percent}%`;
  };

  const contrastBarWidth = getBarWidthPercentage(contrastValue);

  return (
    <>
      <p className="mb-4 flex items-center gap-3">
        <Blend className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
        <span className="text-sm font-medium text-neutral-900">Contrast</span>
      </p>
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex flex-row gap-2">
          <div className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2.5">
            <div className="flex flex-row gap-2 items-center">
              <span className="w-3 h-3 rounded-sm border shadow-xs" style={{ background: color.value }}></span>
              <p className="font-mono text-xs text-slate-950 uppercase">{color.value}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <span className="w-3 h-3 rounded-sm bg-white shadow-xs"></span>
              <p className="font-mono text-xs text-slate-950">#FFFFFF</p>
            </div>
          </div>
          <div className="flex justify-between rounded-md bg-gray-100 px-4 py-2.5">
            <div className="flex items-center gap-2">
              {contrastValue >= 4.5 ? (
                <svg className="text-gray-700" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path fill="currentColor" fillRule="evenodd" d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0m8.907-1.21a.5.5 0 1 0-.814-.58L7.436 9.23 6.353 8.146a.5.5 0 0 0-.706.706l1.5 1.5a.5.5 0 0 0 .76-.062z" clipRule="evenodd">
                    <title>Check</title>
                  </path>
                </svg>
              ) : (
                <svg className="text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fill="currentColor" fillRule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13m2 7a.5.5 0 0 0 0-1H6a.5.5 0 0 0 0 1z" clipRule="evenodd">
                    <title>Minus</title>
                  </path>
                </svg>
              )}
              <p className="font-mono text-xs text-slate-950 whitespace-nowrap">{contrastDisplay} : 1</p>
            </div>
          </div>
        </div>
        <p className={`text-sm text-gray-500 ${(contrastValue < 3) ? '' : 'hidden'}`}>Color does not have enough contrast for text, use only for decorative elements.</p>
        <p className={`text-sm text-gray-500 ${(contrastValue >= 3 && contrastValue < 4.5) ? '' : 'hidden'}`}>Color can be used for large or bold text, avoid using for body copy.</p>
        <p className={`text-sm text-gray-500 ${(contrastValue >= 4.5 && contrastValue < 7) ? '' : 'hidden'}`}>Color provides sufficient contrast for body text and passes WCAG AA guidelines.</p>
        <p className={`text-sm text-gray-500 ${(contrastValue >= 7 && contrastValue < 21) ? '' : 'hidden'}`}>Color offers excellent legibility and meets the highest WCAG AAA standard for text.</p>
        <p className={`text-sm text-gray-500 ${(contrastValue === 21) ? '' : 'hidden'}`}>Color has the strongest possible contrast - ideal for critical text or accessibility indicators.</p>
        <div className="relative flex items-center gap-4">
          <p className="text-[10px] text-gray-400">MIN</p>
          <div className="relative flex-1 gap-4 items-center">
            <span className="flex justify-center w-[2px] h-1 absolute top-0 left-1/5 bg-white text-[10px] text-center pt-4 z-10">3.0</span>
            <span className="flex justify-center w-[2px] h-1 absolute top-0 left-1/3 bg-white text-[10px] text-center pt-4 z-10">4.5</span>
            <span className="flex justify-center w-[2px] h-1 absolute top-0 left-1/2 bg-white text-[10px] text-center pt-4 z-10">7.0</span>
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <span
                      className={`h-1 absolute top-0 left-0 rounded-full after:content-[''] after:absolute after:top-1.5 after:right-[-3px] after:border-[3px] after:border-solid after:border-transparent after:border-t-0 after:border-b-[5px] after:border-b-gray-950 after:w-0 after:h-0 after:z-10 ${contrastValue >= 4.5 ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-gray-400 hover:bg-gray-500'}`}
                      style={{ width: contrastBarWidth }}
                    ></span>
                    <span className="w-full h-1 rounded-full bg-gray-200 block hover:bg-gray-300"></span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="py-2">
                  <div className="space-y-2">
                    <div className="text-[13px] font-medium">WCAG Contrast Guidelines</div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg
                        width="8"
                        height="8"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 text-indigo-500"
                        aria-hidden="true"
                      >
                        <circle cx="4" cy="4" r="4"></circle>
                      </svg>
                      <span className="flex grow gap-2">
                        3.0 : 1 <span className="ml-auto">Minimum</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg
                        width="8"
                        height="8"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 text-purple-500"
                        aria-hidden="true"
                      >
                        <circle cx="4" cy="4" r="4"></circle>
                      </svg>
                      <span className="flex grow gap-2">
                        4.5 : 1 <span className="ml-auto">Acceptable</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg
                        width="8"
                        height="8"
                        fill="currentColor"
                        viewBox="0 0 8 8"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 text-rose-500"
                        aria-hidden="true"
                      >
                        <circle cx="4" cy="4" r="4"></circle>
                      </svg>
                      <span className="flex grow gap-2">
                        7.0 : 1 <span className="ml-auto">Excellent</span>
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-[10px] text-gray-400">MAX</p>
        </div>
      </div>
      { /*
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-input bg-transparent p-4">
          <p className="mb-3 text-xs font-medium">Small Text</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">4.5:1</Badge>
            <span className="text-xs text-gray-500">Required</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={contrast >= 4.5 ? 'green' : 'default'}>{contrast.toFixed(1)}:1</Badge>
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
            <Badge variant={contrast >= 3 ? 'green' : 'default'}>{contrast.toFixed(1)}:1</Badge>
            <span className="text-xs text-gray-500">Current</span>
          </div>
        </div>
      </div> */}
      {/* Contrast against white background END */}
    </>
  );
};

export default ColorContrast;

