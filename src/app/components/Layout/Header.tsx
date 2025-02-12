import { useEffect, useState } from 'react';
import { ModeToggle } from '../../components/ModeSwitcher';
import { MainNav } from '../../components/Navigation/MainNav';
import { cn } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';

export function Header() {
  const context = useConfigContext();
  const [isScrolled, setIsScrolled] = useState(false);

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
        'sticky top-0 z-50 py-4 shadow-[0_0_3px_0_rgba(0,0,0,0.15)] backdrop-blur transition-all duration-300',
        isScrolled && 'bg-background/70 py-3 shadow-[0_0_4px_0_rgba(0,0,0,0.15)]'
      )}
    >
      <header className="border-grid container mx-auto w-full max-w-[1500px] bg-transparent px-8">
        <div className="mx-auto flex items-center justify-between">
          <img className="max-h-5" src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/logo.svg`} alt={context.config?.app?.title} />
          <div className="flex items-center gap-4">
            <MainNav />
            <ModeToggle />
          </div>
        </div>
      </header>
    </div>
  );
}
