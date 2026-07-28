import { AuthShell } from '../../components/Auth/AuthShell';
import { authApiUrl, readApiError } from '../../components/Auth/api';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { CheckCircle2, Laptop, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';

const normalizeCode = (value: string) => value.replace(/\s/g, '').toUpperCase();

export default function DeviceApprovalPage() {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AuthShell title="Authorize CLI">{null}</AuthShell>;
  }

  return <RegistryDeviceApprovalPage />;
}

function RegistryDeviceApprovalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userCode, setUserCode] = useState('');
  const [pending, setPending] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady && typeof router.query.user_code === 'string') setUserCode(normalizeCode(router.query.user_code));
  }, [router.isReady, router.query.user_code]);

  const approve = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const code = normalizeCode(userCode);
    try {
      const response = await fetch(authApiUrl('/api/oauth/device/approve'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: code, userCode: code, action: 'approve' }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'This device code is invalid or has expired.'));
        return;
      }
      setApproved(true);
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(false);
    }
  };

  const callbackUrl = `/cli/device${router.asPath.includes('?') ? router.asPath.slice(router.asPath.indexOf('?')) : ''}`;

  return (
    <AuthShell title="Authorize CLI">
      <Card>
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Laptop />
          </div>
          <CardTitle>Authorize Handoff CLI</CardTitle>
          <CardDescription>
            Connect the terminal that started <code>handoff-app login</code> to your registry account.
          </CardDescription>
        </CardHeader>
        {status === 'loading' ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">Checking your account…</p>
          </CardContent>
        ) : !session?.user ? (
          <CardContent className="space-y-4">
            <Alert variant="info">
              <ShieldCheck />
              <AlertDescription>Sign in before approving a device.</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in to continue</Link>
            </Button>
          </CardContent>
        ) : approved ? (
          <>
            <CardContent>
              <Alert variant="green">
                <CheckCircle2 />
                <AlertTitle>CLI authorized</AlertTitle>
                <AlertDescription>You can close this page and return to your terminal. Login should complete shortly.</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return to documentation</Link>
              </Button>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={approve}>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Signed in as <strong className="text-foreground">{session.user.email}</strong>. Only approve a code you requested from your
                own terminal.
              </p>
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="user-code">Device code</Label>
                <Input
                  id="user-code"
                  value={userCode}
                  onChange={(event) => setUserCode(event.target.value.toUpperCase())}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ABCD-EFGH"
                  className="text-center font-mono text-lg tracking-widest"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={pending || !normalizeCode(userCode)}>
                <ShieldCheck />
                {pending ? 'Authorizing…' : 'Authorize CLI'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}
