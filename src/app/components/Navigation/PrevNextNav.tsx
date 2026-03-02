'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import Link from 'next/link';
import { Button } from '../ui/button';

const PrevNextNav = ({
  previous,
  next,
}: {
  previous: {
    title: string;
    href: string;
  } | null;
  next: {
    title: string;
    href: string;
  } | null;
}) => {
  const showPrevious = previous?.href && previous?.title;
  const showNext = next?.href && next?.title;

  if (!showPrevious && !showNext) return null;

  return (
    <div className={`mt-10 flex items-center gap-8 ${showPrevious && showNext ? 'justify-between' : showNext ? 'justify-end' : 'justify-start'}`}>
      {showPrevious && (
        <Button asChild variant="outline" size="sm" className="flex h-full w-1/2 flex-col items-start gap-0 px-6 py-4 [&_svg]:size-3!">
          <Link href={previous.href}>
            <span className="flex items-center gap-2 font-light text-gray-500">
              <ChevronLeft className="opacity-50" /> Previous
            </span>
            <span className="text-base font-normal">{previous.title}</span>
          </Link>
        </Button>
      )}
      {showNext && (
        <Button asChild variant="outline" size="sm" className="flex h-full w-1/2 flex-col items-end gap-0 px-6 py-4 [&_svg]:size-3!">
          <Link href={next.href}>
            <span className="flex items-center gap-2 font-light text-gray-500">
              Next <ChevronRight className="opacity-50" />
            </span>
            <span className="text-base font-normal">{next.title}</span>
          </Link>
        </Button>
      )}
    </div>
  );
};

export default PrevNextNav;

