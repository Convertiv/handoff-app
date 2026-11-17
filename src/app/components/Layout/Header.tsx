import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AiAssistantTrigger } from '../../components/AiAssistant/AiAssistantProvider';
import { McpConfigDialog } from '../../components/McpIntegration/McpConfigDialog';
import { ModeToggle } from '../../components/ModeSwitcher';
import { MainNav } from '../../components/Navigation/MainNav';
import { MobileNav } from '../../components/Navigation/MobileNav';
import { isScreensPath, SCREENS_ROUTE, screensManifest } from '../../lib/screens/manifest';
import { cn } from '../../lib/utils';
import { Icon } from '../Screens/primitives';
import { useConfigContext } from '../context/ConfigContext';
import { AuthControls } from '../Auth/AuthControls';
import { RuntimeModeBadge } from './RuntimeModeBadge';

export function Header({ hideNav = false }: { hideNav?: boolean }) {
  const context = useConfigContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const runtimeMode = context.config?.runtime?.mode ?? 'workspace';
  // The static export is a self-contained snapshot of the workspace, not a live runtime, so the
  // runtime-mode badge carries no meaning there and is omitted.
  const isStaticSnapshot = process.env.HANDOFF_BUILD_TARGET === 'static';
  // Marks the screens area, so a reader can tell the view is not a docs page.
  const inScreens = isScreensPath(useRouter().pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logo = <img className="max-h-5" src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/logo.svg`} alt={context.config?.app?.title} />;

  return (
    <div
      className={cn(
        'ai-dock-bleed h-17 sticky top-0 z-50 py-4 shadow-[0_0_3px_0_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all duration-300',
        isScrolled && 'bg-background/70 shadow-[0_0_4px_0_rgba(0,0,0,0.15)]'
      )}
    >
      <header className="border-grid container mx-auto w-full max-w-[1500px] bg-transparent px-8">
        <div className="mx-auto flex items-center justify-between @container">
          <div className="flex items-center gap-3">
            {hideNav ? logo : <Link href="/">{logo}</Link>}
            {inScreens && (
              <Link
                href={SCREENS_ROUTE}
                className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground no-underline hover:text-foreground"
              >
                <Icon name="wrench" className="h-3 w-3" />
                {screensManifest.title}
              </Link>
            )}
            {!isStaticSnapshot && <RuntimeModeBadge mode={runtimeMode} />}
          </div>
          {hideNav ? null : (
            <>
              <div className="hidden items-center gap-4 @2xl:flex">
                <MainNav />
                <AiAssistantTrigger />
                <McpConfigDialog />
                {runtimeMode === 'registry' ? <AuthControls /> : null}
                <ModeToggle />
              </div>
              <div className="flex items-center gap-4 @2xl:hidden">
                <MobileNav />
              </div>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
