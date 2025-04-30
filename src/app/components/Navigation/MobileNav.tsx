'use client';
import { Menu, Monitor, Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import { cn } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';

const trimSlashes = (input: string): string => {
  return input.replace(/^\/+|\/+$/g, '');
};

export function MobileNav() {
  const context = useConfigContext();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-[300px] [&>button:first-of-type]:hidden">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>
            <Link href="/">
              <img className="max-h-5" src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/logo.svg`} alt={context.config?.app?.title} />
            </Link>
          </SheetTitle>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </SheetTrigger>
        </SheetHeader>
        <div className="mt-8 flex flex-col space-y-4">
          {context.menu &&
            context.menu.map((section) => {
              const isActive = trimSlashes(router.asPath).startsWith(trimSlashes(section.path));
              return (
                <Link
                  key={section.title}
                  href={section.path}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm',
                    isActive
                      ? 'bg-accent font-normal text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                >
                  {section.title}
                </Link>
              );
            })}
          <div className="mt-4 border-t pt-4">
            <Button variant="ghost" className="w-full justify-start font-normal" onClick={toggleTheme}>
              {theme === 'light' && (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
              {theme === 'dark' && (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
              {(theme === 'system' || !theme) && (
                <>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System Mode</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
