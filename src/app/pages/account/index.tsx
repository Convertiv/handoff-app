import { AccountLayout } from '../../components/Auth/AccountLayout';
import { authApiUrl, readApiError } from '../../components/Auth/api';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AccountUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  role: 'admin' | 'member';
  status?: 'invited' | 'active' | 'deactivated';
}

export default function AccountPage() {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AccountLayout title="Profile">{null}</AccountLayout>;
  }

  return <RegistryAccountPage />;
}

function RegistryAccountPage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gravatarUrl, setGravatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    void fetch(authApiUrl('/api/account'), { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response, 'Could not load your account.'));
        const body = (await response.json()) as AccountUser | { user: AccountUser; gravatarUrl?: string };
        const account = 'user' in body ? body.user : body;
        setUser(account);
        setName(account.name ?? '');
        setAvatarUrl(account.avatarUrl ?? account.image ?? '');
        if ('gravatarUrl' in body && body.gravatarUrl) setGravatarUrl(body.gravatarUrl);
      })
      .catch((error: Error) => setMessage({ text: error.message, error: true }))
      .finally(() => setLoading(false));
  }, [session]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(authApiUrl('/api/account'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatarUrl: avatarUrl.trim() }),
      });
      if (!response.ok) {
        setMessage({ text: await readApiError(response, 'Could not save your profile.'), error: true });
        return;
      }
      setMessage({ text: 'Profile saved.' });
    } catch {
      setMessage({ text: 'Could not connect to the registry.', error: true });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || user?.email || 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AccountLayout title="Profile">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage how your account appears in this registry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {message ? (
            <Alert variant={message.error ? 'destructive' : 'green'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          ) : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : user ? (
            <>
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold">{initials}</div>
                )}
                <div>
                  <p className="font-medium">{name || user.email}</p>
                  <Badge variant={user.status === 'deactivated' ? 'destructive' : 'secondary'} className="mt-1">
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input id="account-email" value={user.email} disabled />
                <p className="text-xs text-muted-foreground">Email addresses cannot be changed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name">Display name</Label>
                <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="account-avatar">Avatar URL</Label>
                  {gravatarUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarUrl(gravatarUrl)}>
                      Use Gravatar
                    </Button>
                  ) : null}
                </div>
                <Input
                  id="account-avatar"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">Use an HTTPS image URL, click Use Gravatar, or leave this empty to show your initials.</p>
              </div>
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
