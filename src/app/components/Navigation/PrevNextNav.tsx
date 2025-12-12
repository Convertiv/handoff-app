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
  return (
    <div className="mt-10 flex items-center justify-between gap-8">
      {previous ? (
        <Button asChild variant="outline" size="sm" className="flex h-full w-full flex-col items-start gap-0 px-6 py-4 [&_svg]:size-3!">
          <Link href={previous.href}>
            <span className="flex items-center gap-2 font-light text-gray-500">
              <ChevronLeft className="opacity-50" /> Previous
            </span>
            <span className="text-base font-normal">{previous.title}</span></Link>
        </Button>
      ) : <div className="w-full h-full" />}
      {next && (
        <Button asChild variant="outline" size="sm" className="flex h-full w-full flex-col items-end gap-0 px-6 py-4 [&_svg]:size-3!">
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

