import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { ClientConfig } from '@handoff/types/config';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { AuthShell } from '../components/Auth/AuthShell';
import { authApiUrl, readApiError } from '../components/Auth/api';
import { getClientRuntimeConfig } from '../components/util';

export const getStaticProps: GetStaticProps = async () => ({ props: { config: getClientRuntimeConfig() } });

export default function ResetPasswordPage({ config }: { config: ClientConfig }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [purpose, setPurpose] = useState<'invite' | 'reset'>('reset');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The invite/reset secret arrives in the URL fragment, which never hits the server, so it stays
  // out of access logs and referrers. Pull it into state, then clear the URL so it doesn't linger in
  // browser history.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const capturedToken = hash.get('token');
    if (!capturedToken) return;
    setToken(capturedToken);
    setPurpose(hash.get('purpose') === 'invite' ? 'invite' : 'reset');
    void router.replace('/reset-password', undefined, { shallow: true });
  }, [router]);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(authApiUrl('/api/auth/request-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email') ?? '')
            .trim()
            .toLowerCase(),
        }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not request a password reset.'));
        return;
      }
      setSent(true);
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') ?? '');
    const passwordConfirmation = String(data.get('passwordConfirmation') ?? '');
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      setPending(false);
      return;
    }
    try {
      const response = await fetch(authApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, passwordConfirmation, purpose }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'This reset link is invalid or has expired.'));
        return;
      }
      await router.push('/login?updated=1');
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell config={config} title={token ? 'Set a new password' : 'Reset password'} centered>
      <Head>
        <meta name="referrer" content="no-referrer" />
      </Head>
      <Card>
        <CardHeader>
          <CardTitle>{token ? 'Set a new password' : 'Reset password'}</CardTitle>
          <CardDescription>
            {sent
              ? 'If an account exists for that email, we sent a link to reset your password.'
              : token
                ? 'Choose a password at least 12 characters long.'
                : 'Enter your email and we will send you a reset link if an account exists.'}
          </CardDescription>
        </CardHeader>
        {sent ? (
          <CardFooter className="flex flex-col gap-3">
            <Link href="/login" className="text-center text-sm text-primary underline-offset-4 hover:underline">
              Return to sign in
            </Link>
          </CardFooter>
        ) : (
          <form onSubmit={token ? resetPassword : requestReset}>
            <CardContent className="space-y-4">
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {token ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirmation">Confirm password</Label>
                    <Input
                      id="passwordConfirmation"
                      name="passwordConfirmation"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Please wait…' : token ? 'Update password' : 'Send reset link'}
              </Button>
              {token ? (
                <Link href="/login" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
                  Back to sign in
                </Link>
              ) : null}
            </CardFooter>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}
