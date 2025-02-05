'use client';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../../components/ui/navigation-menu';
import { cn } from '../../lib/utils';
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
                  <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                    <Link
                      href={section.path}
                      passHref
                      className={cn(
                        'block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                      )}
                    >
                      {section.title}
                    </Link>
                  </NavigationMenuLink>
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages 
                  <NavigationMenuTrigger>{section.title}</NavigationMenuTrigger>
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
                  </NavigationMenuContent>*/}
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
          ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
