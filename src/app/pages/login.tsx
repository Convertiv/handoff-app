import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { ClientConfig } from '@handoff/types/config';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { AuthShell } from '../components/Auth/AuthShell';
import { loadInstallStatus } from '../components/Auth/installStatus';
import { getClientRuntimeConfig } from '../components/util';

const safeCallbackUrl = (value: unknown): string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/';

export const getStaticProps: GetStaticProps = async () => ({ props: { config: getClientRuntimeConfig() } });

export default function LoginPage({ config }: { config: ClientConfig }) {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return (
      <AuthShell config={config} title="Sign in" centered>
        {null}
      </AuthShell>
    );
  }

  return <RegistryLoginPage config={config} />;
}

function RegistryLoginPage({ config }: { config: ClientConfig }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pending, setPending] = useState(false);
  const [checkingInstall, setCheckingInstall] = useState(true);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
      setCheckingInstall(false);
      return;
    }
    void loadInstallStatus()
      .then(async (status) => {
        if (!status) return;
        if (status.installed === false) await router.replace('/install');
        setEmailConfigured(status.emailConfigured !== false);
      })
      .finally(() => setCheckingInstall(false));
  }, [router]);

  // Only a session with a live user counts as signed in. An invalidated token still reports
  // `authenticated` but has no user, so redirecting on status alone would bounce the visitor away
  // before they could reach this form. That's the sign-in loop that clearing cookies used to fix.
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      void router.replace(safeCallbackUrl(router.query.callbackUrl));
    }
  }, [router, session, status]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await signIn('handoff-credentials', {
      email: String(data.get('email') ?? '')
        .trim()
        .toLowerCase(),
      password: String(data.get('password') ?? ''),
      redirect: false,
    });
    setPending(false);

    if (!result || result.error) {
      setError('Invalid email or password.');
      return;
    }
    await router.push(safeCallbackUrl(router.query.callbackUrl));
  };

  return (
    <AuthShell config={config} title="Sign in" centered>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your Handoff account email and password.</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            {router.query.updated === '1' ? (
              <p className="text-sm text-green-600 dark:text-green-400">Your password was updated. Sign in below.</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending || checkingInstall}>
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
            {emailConfigured ? (
              <Link href="/reset-password" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            ) : (
              <p className="text-center text-sm text-muted-foreground">Forgot your password? Ask an administrator for a reset link.</p>
            )}
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
