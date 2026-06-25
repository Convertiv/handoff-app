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
import { useNavContext } from '../context/NavProvider';

const trimSlashes = (input: string): string => {
  return input.replace(/^\/+|\/+$/g, '');
};

export function MainNav() {
  const context = useConfigContext();
  const { nav } = useNavContext();
  const router = useRouter();
  // In registry mode the per-page baked menu is empty for lambda-rendered pages, so use the cached
  // shell (top-level sections need no entity enrichment). Workspace/static keep the baked menu.
  const isRegistry = context.config?.runtime?.mode === 'registry';
  const menu = isRegistry ? nav?.shell ?? context.menu : context.menu;
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {menu &&
          menu.map((section) => {
            const isActive = trimSlashes(router.asPath).startsWith(trimSlashes(section.path));
            return (
              <NavigationMenuItem key={section.title}>
                {section.subSections && section.subSections.length > 0 ? (
                  <>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                      <Link
                        href={section.path}
                        className={cn(
                          'block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                        )}
                        {...(isActive ? { 'data-active': 'true' } : {})}
                      >
                        {section.title}
                      </Link>
                    </NavigationMenuLink>
                  </>
                ) : section.external ? (
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link href={section.external as string} target="_blank" rel="noopener noreferrer">
                      {section.title}
                    </Link>
                  </NavigationMenuLink>
                ) : (
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link
                      href={section.path}
                      className="block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      {...(isActive ? { 'data-active': 'true' } : {})}
                    >
                      <span className="text-sm leading-none">{section.title}</span>
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
