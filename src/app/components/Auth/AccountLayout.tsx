import type { ClientConfig } from '@handoff/types/config';
import { Bot, CircleUserRound, KeyRound, Users, type LucideIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';
import { AuthShell } from './AuthShell';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navGroups: { label: string; links: NavLink[] }[] = [
  {
    label: 'Account',
    links: [
      { href: '/account', label: 'Profile', icon: CircleUserRound },
      { href: '/account/tokens', label: 'Access tokens', icon: KeyRound },
      // Only meaningful where a connection declares `credential: 'user'`; the page itself says so
      // when none does, rather than the nav guessing at a build-time value the browser cannot read.
      ...(process.env.HANDOFF_AI_ENABLED === 'true' ? [{ href: '/account/ai', label: 'AI providers', icon: Bot }] : []),
    ],
  },
  {
    label: 'Administration',
    links: [{ href: '/account/users', label: 'Users', icon: Users, adminOnly: true }],
  },
];

interface AccountLayoutProps {
  children: ReactNode;
  config?: ClientConfig;
  title: string;
  description?: string;
}

export function AccountLayout({ children, config, title, description }: AccountLayoutProps) {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AuthShell config={config} title={title}>{null}</AuthShell>;
  }

  return (
    <RegistryAccountLayout config={config} title={title} description={description}>
      {children}
    </RegistryAccountLayout>
  );
}

function RegistryAccountLayout({ children, config, title, description }: AccountLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Redirect to login whenever there's no live user, not just on `unauthenticated`. An invalidated
  // token still reports `authenticated` but carries no user, so checking status alone leaves the
  // shell stuck in a broken half-signed-in state.
  useEffect(() => {
    if (status !== 'loading' && !session?.user) {
      void router.replace(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [router, session, status]);

  return (
    <AuthShell config={config} title={title} wide>
      {status === 'loading' || !session?.user ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Loading account…</p>
      ) : (
        <div className="grid md:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="pt-5">
            {navGroups
              .map((group) => ({
                ...group,
                links: group.links.filter((link) => !link.adminOnly || role === 'admin'),
              }))
              .filter((group) => group.links.length > 0)
              .map((group, index) => (
                <div key={group.label}>
                  {index > 0 ? <Separator className="my-4 hidden md:block" /> : null}
                  <p className="flex h-8 items-center px-2 text-xs font-medium text-muted-foreground">{group.label}</p>
                  <nav className="flex gap-1 overflow-x-auto md:flex-col">
                    {group.links.map((link) => {
                      const active = router.pathname === link.href;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            'group/nav-item flex h-9 items-center gap-3 whitespace-nowrap rounded-md px-3 text-sm',
                            active ? 'bg-accent font-medium text-accent-foreground' : 'hover:bg-accent/50'
                          )}
                        >
                          <Icon
                            className={cn(
                              'size-4 shrink-0',
                              active ? 'text-foreground' : 'text-muted-foreground group-hover/nav-item:text-foreground'
                            )}
                            strokeWidth={1.5}
                          />
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
          </aside>
          <section className="min-w-0 py-8 md:pl-8 lg:py-16 lg:pl-16">
            <div className="mx-auto w-full max-w-4xl space-y-8">
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
              </div>
              {children}
            </div>
          </section>
        </div>
      )}
    </AuthShell>
  );
}
