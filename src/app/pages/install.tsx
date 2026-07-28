import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CheckCircle2, CircleAlert, Database, KeyRound, Mail, RefreshCw, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AuthShell } from '../components/Auth/AuthShell';
import { authApiUrl, readApiError } from '../components/Auth/api';

type InstallStep = 'preflight' | 'administrator' | 'complete';

interface PreflightCheck {
  id: string;
  label: string;
  ok: boolean;
  message?: string;
  optional?: boolean;
}

interface InstallStatus {
  installed?: boolean;
  ready?: boolean;
  error?: string | { message?: string };
  message?: string;
  checks?: PreflightCheck[] | Record<string, boolean | { ok?: boolean; label?: string; message?: string; optional?: boolean }>;
  emailConfigured?: boolean;
}

const checkLabels: Record<string, string> = {
  runtime: 'Registry runtime',
  database: 'Database connection',
  migrations: 'Database migrations',
  users: 'Empty user directory',
  authSecret: 'Authentication secret',
  appUrl: 'Canonical application URL',
  email: 'Email delivery',
};

const normalizeChecks = (status: InstallStatus): PreflightCheck[] => {
  if (Array.isArray(status.checks) && status.checks.length > 0) return status.checks;
  if (status.checks) {
    return Object.entries(status.checks).map(([id, value]) => ({
      id,
      label: typeof value === 'object' && value.label ? value.label : (checkLabels[id] ?? id),
      ok: typeof value === 'boolean' ? value : value.ok === true,
      message: typeof value === 'object' ? value.message : undefined,
      optional: typeof value === 'object' ? value.optional : undefined,
    }));
  }

  return [
    {
      id: 'preflight',
      label: 'Registry configuration',
      ok: status.ready === true,
      message: status.ready ? 'The registry is ready to install.' : 'Complete the registry configuration and run database migrations.',
    },
    {
      id: 'email',
      label: 'Email delivery',
      ok: status.emailConfigured === true,
      optional: true,
      message: status.emailConfigured ? 'Invitation and reset emails are enabled.' : 'Optional. Invite links can be delivered manually.',
    },
  ];
};

export default function InstallPage() {
  const router = useRouter();
  const [step, setStep] = useState<InstallStep>('preflight');
  const [checks, setChecks] = useState<PreflightCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreflight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(authApiUrl('/api/install'), { credentials: 'include', cache: 'no-store' });
      const status = (await response.json().catch(() => ({}))) as InstallStatus;
      if (!response.ok) {
        setChecks(normalizeChecks(status));
        setError(
          typeof status.error === 'string'
            ? status.error
            : (status.error?.message ?? status.message ?? 'Could not check the registry configuration.')
        );
        return;
      }

      if (status.installed) {
        void router.replace('/login');
        return;
      }
      setChecks(normalizeChecks(status));
    } catch {
      setChecks([]);
      setError('Could not connect to the registry. Check the deployment and try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (process.env.HANDOFF_RUNTIME_MODE === 'registry') void runPreflight();
    else setLoading(false);
  }, [runPreflight]);

  const blockingChecks = checks.filter((check) => !check.ok && !check.optional);
  const ready = checks.length > 0 && blockingChecks.length === 0;

  const install = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const passwordConfirmation = String(form.get('passwordConfirmation') ?? '');
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(authApiUrl('/api/install'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(form.get('email') ?? '')
            .trim()
            .toLowerCase(),
          name: String(form.get('name') ?? '').trim(),
          password,
          passwordConfirmation,
        }),
      });

      if (response.status === 409) {
        setError('This registry has already been installed. Continue to sign in.');
        return;
      }
      if (!response.ok) {
        setError(await readApiError(response, 'Installation could not be completed.'));
        return;
      }
      setStep('complete');
    } catch {
      setError('Could not connect to the registry. No installation changes were made.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Install registry" description="Configure the first Handoff Registry administrator.">
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">Registry installation</p>
        <div className="mt-3 grid grid-cols-3 gap-2" aria-label="Installation progress">
          {[
            ['preflight', '1. Preflight'],
            ['administrator', '2. Administrator'],
            ['complete', '3. Complete'],
          ].map(([id, label]) => (
            <div
              key={id}
              className={`rounded-md px-3 py-2 text-center text-xs font-medium ${
                step === id ? 'bg-gray-800 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {step === 'preflight' ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Handoff Registry</CardTitle>
            <CardDescription>
              Before creating the administrator, we will verify that this deployment is ready. The installer never changes the database
              schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Preflight failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {loading ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking the registry…
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {checks.map((check) => (
                  <div key={check.id} className="flex gap-3 p-4">
                    {check.ok ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    ) : check.optional ? (
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    ) : (
                      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {check.label} {check.optional ? <span className="font-normal text-muted-foreground">(optional)</span> : null}
                      </p>
                      {check.message ? <p className="mt-1 text-xs text-muted-foreground">{check.message}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {blockingChecks.length > 0 ? (
              <Alert variant="warning">
                <Database />
                <AlertTitle>Deployment action required</AlertTitle>
                <AlertDescription>
                  Correct the checks above, run <code>handoff-app db:migrate</code> if migrations are missing, then retry.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <Button variant="outline" onClick={() => void runPreflight()} disabled={loading}>
              <RefreshCw />
              Retry checks
            </Button>
            <Button onClick={() => setStep('administrator')} disabled={!ready || loading}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === 'administrator' ? (
        <Card>
          <CardHeader>
            <CardTitle>Create the administrator</CardTitle>
            <CardDescription>This account will manage registry users and issue access tokens.</CardDescription>
          </CardHeader>
          <form onSubmit={install}>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" name="name" autoComplete="name" required maxLength={100} placeholder="Alex Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="admin@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
              <Alert variant="warning">
                <KeyRound />
                <AlertDescription>
                  Installation is permanent. Handoff prevents this screen from creating another administrator after completion.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="outline" onClick={() => setStep('preflight')} disabled={submitting}>
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                <UserRound />
                {submitting ? 'Installing…' : 'Install registry'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      {step === 'complete' ? (
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 />
            </div>
            <CardTitle>Registry installed</CardTitle>
            <CardDescription>Your administrator account is ready. No access token was created during installation.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <strong>1.</strong>
                <span>Sign in with the administrator account you just created.</span>
              </li>
              <li className="flex gap-3">
                <strong>2.</strong>
                <span>
                  Run <code className="rounded bg-muted px-1.5 py-0.5">handoff-app login --url &lt;registry-url&gt;</code> in your
                  workspace.
                </span>
              </li>
              <li className="flex gap-3">
                <strong>3.</strong>
                <span>Approve the device code in this registry to authorize publishing and checkout.</span>
              </li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Continue to sign in</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </AuthShell>
  );
}
