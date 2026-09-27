import { ArrowLeft } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ThemeProvider } from '../util/theme-provider';

const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

interface AuthShellProps {
  children: ReactNode;
  title: string;
  description?: string;
  wide?: boolean;
  hideNav?: boolean;
  centered?: boolean;
}

export function AuthShell({ children, title, description, wide = false, hideNav = false, centered = false }: AuthShellProps) {
  if (!isRegistryRuntime) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Registry only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Account management is available only in a deployed registry.</p>
          <Button asChild variant="ghost" size="sm" className="mt-6 gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to documentation
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Head>
        <title>{title} · Handoff Registry</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>
      {centered ? (
        <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-background px-4 py-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      ) : (
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className={`h-17 container mx-auto flex items-center justify-between px-6 ${wide ? 'max-w-[1500px]' : 'max-w-[1200px]'}`}>
              {hideNav ? (
                <span className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="max-h-5" src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/logo.svg`} alt="Handoff" />
                  <Badge variant="info">Registry</Badge>
                </span>
              ) : (
                <Link href="/" className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="max-h-5" src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/logo.svg`} alt="Handoff" />
                  <Badge variant="info">Registry</Badge>
                </Link>
              )}
              {hideNav ? null : (
                <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    Back to documentation
                  </Link>
                </Button>
              )}
            </div>
          </header>
          <main className={`container mx-auto px-6 ${wide ? 'max-w-[1500px]' : 'max-w-xl py-10'}`}>{children}</main>
        </div>
      )}
    </ThemeProvider>
  );
}
