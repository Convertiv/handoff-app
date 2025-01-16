'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useConfigContext } from '../context/ConfigContext';

export function MainNav() {
  const context = useConfigContext();
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {context.menu &&
          context.menu.map((section) => (
            <NavigationMenuItem key={section.title}>
              {section.subSections && section.subSections.length > 0 ? (
                <>
                  <Link
                    href={section.path}
                    passHref
                    className={cn(
                      'block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                    )}
                  >
                    <NavigationMenuTrigger>{section.title}</NavigationMenuTrigger>
                  </Link>
                  <NavigationMenuContent className="gap-1 p-2 md:w-[200px] lg:w-[200px]">
                    {section.subSections.map((child) => (
                      <NavigationMenuLink key={child.title}>
                        <Link
                          href={`/${child.path}`}
                          passHref
                          className={cn(
                            'block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                          )}
                        >
                          <div className="text-sm leading-none">{child.title}</div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </>
              ) : (
                <Link
                  href={section.path}
                  passHref
                  legacyBehavior
                  className="block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <div className="text-sm leading-none">{section.title}</div>
                  </NavigationMenuLink>
                </Link>
              )}
            </NavigationMenuItem>
          ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
