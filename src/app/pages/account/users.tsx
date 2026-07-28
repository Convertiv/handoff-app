import { AccountLayout } from '../../components/Auth/AccountLayout';
import { authApiUrl, readApiError } from '../../components/Auth/api';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Check, Copy, MailPlus, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FormEvent, useCallback, useEffect, useState } from 'react';

interface RegistryUser {
  id: string;
  name?: string | null;
  email: string;
  role: 'admin' | 'member';
  status: 'invited' | 'active' | 'deactivated';
  emailVerified?: string | null;
  createdAt?: string;
}

interface MutationResult {
  activationUrl?: string;
  inviteUrl?: string;
  message?: string;
}

export default function UsersPage() {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AccountLayout title="Users">{null}</AccountLayout>;
  }

  return <RegistryUsersPage />;
}

function RegistryUsersPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const currentUser = session?.user as (typeof session.user & { id?: string; role?: string }) | undefined;
  const [users, setUsers] = useState<RegistryUser[]>([]);
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && currentUser?.role !== 'admin') void router.replace('/account');
  }, [currentUser?.role, router, sessionStatus]);

  const load = useCallback(async () => {
    const response = await fetch(authApiUrl('/api/admin/users'), { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error(await readApiError(response, 'Could not load users.'));
    const body = (await response.json()) as RegistryUser[] | { users: RegistryUser[] };
    const rows = Array.isArray(body) ? body : body.users;
    setUsers(
      rows.map((user) => ({
        ...user,
        status: user.status ?? (user.emailVerified ? 'active' : 'invited'),
      }))
    );
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') void load().catch((reason: Error) => setError(reason.message));
  }, [currentUser?.role, load]);

  const showResult = (body: MutationResult, fallback: string) => {
    setSuccess(body.message ?? fallback);
    setManualLink(body.activationUrl ?? body.inviteUrl ?? null);
  };

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    setManualLink(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch(authApiUrl('/api/admin/users'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email') ?? '')
            .trim()
            .toLowerCase(),
          name: String(data.get('name') ?? '').trim(),
          role: inviteRole,
        }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not invite the user.'));
        return;
      }
      const body = (await response.json().catch(() => ({}))) as MutationResult;
      showResult(body, 'Invitation created.');
      form.reset();
      setInviteRole('member');
      await load();
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(false);
    }
  };

  const mutate = async (user: RegistryUser, action: 'resend' | 'role' | 'status', body: Record<string, string>, successMessage: string) => {
    setPending(true);
    setError(null);
    setSuccess(null);
    setManualLink(null);
    try {
      const response = await fetch(authApiUrl(`/api/admin/users/${encodeURIComponent(user.id)}/${action}`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not update the user.'));
        return;
      }
      const result = (await response.json().catch(() => ({}))) as MutationResult;
      showResult(result, successMessage);
      await load();
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(false);
    }
  };

  const copyLink = async () => {
    if (!manualLink) return;
    await navigator.clipboard.writeText(manualLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AccountLayout title="Users">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite a user</CardTitle>
            <CardDescription>
              Email delivery is used when configured. Otherwise, the activation link appears once for manual delivery.
            </CardDescription>
          </CardHeader>
          <form onSubmit={invite}>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {success ? (
                <Alert variant="green">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              ) : null}
              {manualLink ? (
                <Alert variant="warning">
                  <MailPlus />
                  <AlertTitle>Deliver this activation link securely</AlertTitle>
                  <AlertDescription>
                    <p className="mb-3">It is shown only in this response.</p>
                    <div className="flex gap-2">
                      <Input value={manualLink} readOnly className="text-xs" />
                      <Button type="button" size="icon" variant="outline" onClick={() => void copyLink()} aria-label="Copy activation link">
                        {copied ? <Check /> : <Copy />}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Display name</Label>
                  <Input id="invite-name" name="name" required maxLength={100} placeholder="Alex Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input id="invite-email" name="email" type="email" required placeholder="colleague@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as typeof inviteRole)}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t px-6 py-4">
              <Button type="submit" disabled={pending}>
                <MailPlus />
                {pending ? 'Inviting…' : 'Invite user'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registry users</CardTitle>
            <CardDescription>
              Manage roles and access. Deactivation preserves the user record and revokes their credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        disabled={pending}
                        onValueChange={(role) => {
                          if (role !== user.role) void mutate(user, 'role', { role }, `Updated ${user.email}.`);
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'green' : user.status === 'deactivated' ? 'destructive' : 'warning'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {user.status === 'invited' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => void mutate(user, 'resend', {}, `Invitation resent to ${user.email}.`)}
                          >
                            <RefreshCw /> Resend
                          </Button>
                        ) : null}
                        {user.status !== 'invited' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending || (user.id === currentUser?.id && user.status === 'active')}
                            onClick={() => {
                              const nextStatus = user.status === 'active' ? 'deactivated' : 'active';
                              const message =
                                nextStatus === 'active'
                                  ? `Reactivate ${user.email}?`
                                  : `Deactivate ${user.email} and revoke their credentials?`;
                              if (window.confirm(message)) void mutate(user, 'status', { status: nextStatus }, `Updated ${user.email}.`);
                            }}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!users.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
