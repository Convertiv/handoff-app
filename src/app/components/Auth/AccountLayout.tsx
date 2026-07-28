import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { AuthShell } from './AuthShell';

const navGroups = [
  {
    label: 'Account',
    links: [
      { href: '/account', label: 'Profile' },
      { href: '/account/tokens', label: 'Access tokens' },
    ],
  },
  {
    label: 'Administration',
    links: [{ href: '/account/users', label: 'Users', adminOnly: true }],
  },
];

export function AccountLayout({ children, title }: { children: ReactNode; title: string }) {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AuthShell title={title}>{null}</AuthShell>;
  }

  return <RegistryAccountLayout title={title}>{children}</RegistryAccountLayout>;
}

function RegistryAccountLayout({ children, title }: { children: ReactNode; title: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      void router.replace(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [router, status]);

  return (
    <AuthShell title={title} wide>
      {status === 'loading' || status === 'unauthenticated' ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Loading account…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="space-y-6">
            {navGroups
              .map((group) => ({
                ...group,
                links: group.links.filter((link) => !('adminOnly' in link && link.adminOnly) || role === 'admin'),
              }))
              .filter((group) => group.links.length > 0)
              .map((group) => (
                <div key={group.label}>
                  <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
                  <nav className="flex gap-1 overflow-x-auto md:flex-col">
                    {group.links.map((link) => {
                      const active = router.pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            'whitespace-nowrap rounded-md px-3 py-2 text-sm',
                            active
                              ? 'bg-accent font-medium text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                          )}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      )}
    </AuthShell>
  );
}
