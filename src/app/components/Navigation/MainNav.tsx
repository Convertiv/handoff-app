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
import { isScreensPath, listedScreens, SCREENS_ROUTE, screensManifest } from '../../lib/screens/manifest';
import { cn } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';
import { useNav } from '../context/NavProvider';

const trimSlashes = (input: string): string => {
  return input.replace(/^\/+|\/+$/g, '');
};

export function MainNav() {
  const context = useConfigContext();
  const router = useRouter();
  // Screens are their own area: a docs section that links into it stays out, and one item leads there.
  const menu = useNav().menu?.filter((section) => !isScreensPath(`/${trimSlashes(section.path ?? '')}`));
  const hasScreens = listedScreens().length > 0;
  const inScreens = isScreensPath(router.pathname);
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
        {hasScreens && (
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
              <Link
                href={SCREENS_ROUTE}
                className="block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                {...(inScreens ? { 'data-active': 'true' } : {})}
              >
                <span className="text-sm leading-none">{screensManifest.title}</span>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
