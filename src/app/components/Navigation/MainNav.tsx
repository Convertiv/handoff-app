'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../../components/ui/navigation-menu';
import { cn } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';

const trimSlashes = (input: string): string => {
  return input.replace(/^\/+|\/+$/g, '');
};

export function MainNav() {
  const context = useConfigContext();
  const router = useRouter();
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {context.menu &&
          context.menu.map((section) => {
            const isActive = trimSlashes(router.asPath).startsWith(trimSlashes(section.path));
            return (
              <NavigationMenuItem key={section.title}>
                {section.subSections && section.subSections.length > 0 ? (
                  <>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                      <Link
                        href={section.path}
                        passHref
                        className={cn(
                          'block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                        )}
                        {...(isActive ? { 'data-active': 'true' } : {})}
                      >
                        {section.title} {isActive}
                      </Link>
                    </NavigationMenuLink>
                  </>
                ) : (
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link
                      href={section.path}
                      passHref
                      legacyBehavior
                      className="block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm leading-none">{section.title}</div>
                    </Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            );
          })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
