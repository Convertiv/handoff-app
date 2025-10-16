'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../ui/button';

const PrevNextNav = () => {
  return (
    <div className="mt-10 flex items-center justify-between gap-8">
      <Button variant="outline" size="sm" className="flex h-full w-full flex-col items-start gap-0 px-6 py-4 [&_svg]:size-3!">
        <span className="flex items-center gap-2 font-light text-gray-500">
          <ChevronLeft className="opacity-50" /> Previous
        </span>
        <span className="text-base font-normal">Accordion</span>
      </Button>
      <Button variant="outline" size="sm" className="flex h-full w-full flex-col items-end gap-0 px-6 py-4 [&_svg]:size-3!">
        <span className="flex items-center gap-2 font-light text-gray-500">
          Next <ChevronRight className="opacity-50" />
        </span>
        <span className="text-base font-normal">Button</span>
      </Button>
    </div>
  );
};

export default PrevNextNav;

