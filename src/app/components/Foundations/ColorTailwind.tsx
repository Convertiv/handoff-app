import React from 'react';
import CopyToClipboard from '../CopyToClipboard';

const ColorTailwind: React.FC = () => (
  <>
    <p className="mb-4 flex items-center gap-3">
      <svg className="h-[14px] w-[14px] text-slate-400 opacity-30" viewBox="0 0 668 398" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_4870_311)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M334 0.199951C245.1 0.199951 189.567 44.3666 167.333 132.733C200.667 88.5666 239.567 72 284 83.0333C309.367 89.3333 327.5 107.633 347.533 127.867C380.233 160.833 418.067 199 500.667 199C589.567 199 645.1 154.833 667.333 66.4666C634 110.633 595.133 127.2 550.667 116.167C525.3 109.867 507.167 91.5666 487.1 71.3333C454.433 38.3333 416.633 0.199951 334 0.199951ZM167.333 199C78.4333 199 22.9 243.167 0.666626 331.533C34 287.333 72.9 270.8 117.333 281.833C142.7 288.133 160.833 306.433 180.9 326.667C213.567 359.633 251.4 397.8 334.033 397.8C422.933 397.8 478.467 353.633 500.7 265.267C467.367 309.433 428.467 326 384.033 314.967C358.667 308.667 340.533 290.367 320.5 270.133C287.767 237.167 249.933 199 167.333 199Z"
            fill="black"
          />
        </g>
        <defs>
          <clipPath id="clip0_4870_311">
            <rect width="668" height="398" fill="white" />
          </clipPath>
        </defs>
      </svg>
      <span className="text-sm font-medium text-neutral-900">Tailwind Usage</span>
    </p>
    <div className="flex flex-col gap-3">
      <div className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
        <p className="font-mono text-xs text-gray-400">Background</p>
        <div className="relative flex items-end gap-2">
          <code className="font-mono text-xs text-gray-900">bg-primary-500</code>
          <CopyToClipboard value="bg-primary-500" tooltip="Copy class" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400 bg-transparent shadow-none" />
        </div>
      </div>
      <div className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
        <p className="font-mono text-xs text-gray-400">Text</p>
        <div className="relative flex items-end gap-2">
          <code className="font-mono text-xs text-gray-900">text-primary-500</code>
          <CopyToClipboard value="text-primary-500" tooltip="Copy class" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400 bg-transparent shadow-none" />
        </div>
      </div>
      <div className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
        <p className="font-mono text-xs text-gray-400">Border</p>
        <div className="relative flex items-end gap-2">
          <code className="font-mono text-xs text-gray-900">border-primary-500</code>
          <CopyToClipboard value="border-primary-500" tooltip="Copy class" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400 bg-transparent shadow-none" />
        </div>
      </div>
      <div className="flex w-full justify-between rounded-md bg-gray-100 px-4 py-2">
        <p className="font-mono text-xs text-gray-400">Variable</p>
        <div className="relative flex items-end gap-2">
          <code className="font-mono text-xs text-gray-900">var(--color-primary-500)</code>
          <CopyToClipboard value="var(--color-primary-500)" tooltip="Copy variable" className="border-none size-4 [&_svg]:size-2.5 [&_svg]:stroke-gray-400 bg-transparent shadow-none" />
        </div>
      </div>
    </div>
  </>
);

export default ColorTailwind;

