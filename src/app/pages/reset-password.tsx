import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { AuthShell } from '../components/Auth/AuthShell';
import { authApiUrl, readApiError } from '../components/Auth/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const purpose = router.query.purpose === 'invite' ? 'invite' : 'reset';
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <AuthShell title={token ? 'Set a new password' : 'Reset password'}>
      <Card>
        <CardHeader>
          <CardTitle>{token ? 'Set a new password' : 'Reset password'}</CardTitle>
          <CardDescription>
            {sent
              ? 'If an account exists for that email, a password reset link has been sent.'
              : token
                ? 'Choose a new password for your registry account.'
                : 'Enter your email and we will send a reset link if an account exists.'}
          </CardDescription>
        </CardHeader>
        {sent ? (
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Return to sign in</Link>
            </Button>
          </CardFooter>
        ) : (
          <form onSubmit={token ? resetPassword : requestReset}>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {token ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
                    <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
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
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Please wait…' : token ? 'Update password' : 'Send reset link'}
              </Button>
              <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}
