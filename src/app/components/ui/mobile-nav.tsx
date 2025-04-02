'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { SectionLink } from '../util';

import { Button } from './button';
import { Drawer, DrawerContent, DrawerTrigger } from './drawer';

interface MobileNavProps {
  menu: SectionLink;
}

export function MobileNav({ menu }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const onOpenChange = React.useCallback((open: boolean) => {
    setOpen(open);
  }, []);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-full gap-4 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="!size-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80svh]">
        <div className="overflow-auto p-6">
          <nav className="mobile-nav">
            <ul className="flex flex-col space-y-3">
              {menu.subSections.map((item) => (
                <li className={`u-animation-fadein ${item.menu ? ' has_children' : ''}`} key={`${item.path}-${item.title}`}>
                  {!item.path ? (
                    <small className="text-lg font-medium">{item.title}</small>
                  ) : (
                    <>
                      <Link
                        href={`/${item.path}`}
                        className="text-[1.15rem]"
                        onClick={() => {
                          router.push(`/${item.path}`);
                          setOpen(false);
                        }}
                      >
                        {item.title}
                      </Link>
                      {item.menu && (
                        <ul className={`ml-4 mt-2 space-y-2${pathname.includes(item.path) ? ' is-active' : ''}`}>
                          {item.menu.map((subItem) => (
                            <li key={subItem.path}>
                              <Link
                                href={`/${subItem.path}`}
                                className="text-[1rem] opacity-80"
                                onClick={() => {
                                  router.push(`/${subItem.path}`);
                                  setOpen(false);
                                }}
                              >
                                {subItem.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
