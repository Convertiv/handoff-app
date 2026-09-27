import { ArrowLeft } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import type { ClientConfig } from '@handoff/types/config';
import type { ReactNode } from 'react';
import { ConfigContextProvider } from '../context/ConfigContext';
import { Header } from '../Layout/Header';
import { Button } from '../ui/button';
import { ThemeProvider } from '../util/theme-provider';

const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

interface AuthShellProps {
  children: ReactNode;
  config?: ClientConfig;
  title: string;
  description?: string;
  wide?: boolean;
  hideNav?: boolean;
  centered?: boolean;
}

export function AuthShell({ children, config, title, description, wide = false, hideNav = false, centered = false }: AuthShellProps) {
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
        <ConfigContextProvider defaultConfig={config}>
          <div className="min-h-screen bg-background">
            <Header hideNav={hideNav} />
            <main className={`container mx-auto px-8 ${wide ? 'max-w-[1500px]' : 'max-w-xl py-10'}`}>{children}</main>
          </div>
        </ConfigContextProvider>
      )}
    </ThemeProvider>
  );
}
