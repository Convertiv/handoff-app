import Link from 'next/link';
import { useEffect, useState } from 'react';
import { McpConfigDialog } from '../../components/McpIntegration/McpConfigDialog';
import { ModeToggle } from '../../components/ModeSwitcher';
import { MainNav } from '../../components/Navigation/MainNav';
import { MobileNav } from '../../components/Navigation/MobileNav';
import { cn } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';
import { AuthControls } from '../Auth/AuthControls';
import { RuntimeModeBadge } from './RuntimeModeBadge';

export function Header() {
  const context = useConfigContext();
  const [isScrolled, setIsScrolled] = useState(false);
  const runtimeMode = context.config?.runtime?.mode ?? 'workspace';
  // The static export is a self-contained snapshot of the workspace, not a live runtime, so the
  // runtime-mode badge carries no meaning there and is omitted.
  const isStaticSnapshot = process.env.HANDOFF_BUILD_TARGET === 'static';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        'sticky top-0 z-50 py-4 shadow-[0_0_3px_0_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all duration-300',
        isScrolled && 'bg-background/70 py-3 shadow-[0_0_4px_0_rgba(0,0,0,0.15)]'
      )}
    >
      <header className="border-grid container mx-auto w-full max-w-[1500px] bg-transparent px-8">
        <div className="mx-auto flex items-center justify-between @container">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img className="max-h-5" src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/logo.svg`} alt={context.config?.app?.title} />
            </Link>
            {!isStaticSnapshot && <RuntimeModeBadge mode={runtimeMode} />}
          </div>
          <div className="hidden items-center gap-4 @2xl:flex">
            <MainNav />
            <McpConfigDialog />
            {runtimeMode === 'registry' ? <AuthControls /> : null}
            <ModeToggle />
          </div>
          <div className="flex items-center gap-4 @2xl:hidden">
            <MobileNav />
          </div>
        </div>
      </header>
    </div>
  );
}
