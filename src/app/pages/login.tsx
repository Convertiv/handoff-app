import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { AuthShell } from '../components/Auth/AuthShell';
import { authApiUrl } from '../components/Auth/api';

const safeCallbackUrl = (value: unknown): string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/';

export default function LoginPage() {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AuthShell title="Sign in">{null}</AuthShell>;
  }

  return <RegistryLoginPage />;
}

function RegistryLoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [pending, setPending] = useState(false);
  const [checkingInstall, setCheckingInstall] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
      setCheckingInstall(false);
      return;
    }
    void fetch(authApiUrl('/api/install'), { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as { installed?: boolean };
        if (body.installed === false) await router.replace('/install');
      })
      .finally(() => setCheckingInstall(false));
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      void router.replace(safeCallbackUrl(router.query.callbackUrl));
    }
  }, [router, status]);

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
    <AuthShell title="Sign in">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your Handoff Registry email and password.</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            {router.query.updated === '1' ? (
              <Alert variant="green">
                <AlertDescription>Your password was updated. Sign in below.</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending || checkingInstall}>
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
            <Link href="/reset-password" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </CardFooter>
        </form>
      </Card>
    </AuthShell>
  );
}
