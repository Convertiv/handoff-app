import React from 'react';

import { Contrast } from 'lucide-react';
import { Badge } from '../ui/badge';

type ColorContrastProps = {
  contrast: number;
};

const ColorContrast: React.FC<ColorContrastProps> = ({ contrast }) => (
  <>
    {/* Contrast against white background START */}
    <p className="mb-3 flex items-center gap-3">
        <Contrast className="h-[14px] w-[14px] text-slate-700 opacity-70" strokeWidth={1.5} />
      <span className="text-sm font-normal">Contrast against white background</span>
    </p>
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
    </div>
    {/* Contrast against white background END */}
  </>
);

export default ColorContrast;

