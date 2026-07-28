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
import { Check, Copy, KeyRound, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

interface AccessToken {
  id: string;
  name: string;
  prefix?: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString();
};

export default function TokensPage() {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AccountLayout title="Access tokens">{null}</AccountLayout>;
  }

  return <RegistryTokensPage />;
}

function RegistryTokensPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [scope, setScope] = useState<'registry:read' | 'registry:write'>('registry:read');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(authApiUrl('/api/account/tokens'), { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error(await readApiError(response, 'Could not load access tokens.'));
    const body = (await response.json()) as AccessToken[] | { tokens: AccessToken[] };
    setTokens(Array.isArray(body) ? body : body.tokens);
  }, []);

  useEffect(() => {
    if (process.env.HANDOFF_RUNTIME_MODE === 'registry' && session?.user) {
      void load().catch((reason: Error) => setError(reason.message));
    }
  }, [load, session]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setCreatedToken(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(authApiUrl('/api/account/tokens'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: String(data.get('name') ?? '').trim(), scopes: [scope] }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not create the access token.'));
        return;
      }
      const body = (await response.json()) as { token?: string; accessToken?: string };
      setCreatedToken(body.token ?? body.accessToken ?? null);
      event.currentTarget.reset();
      await load();
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(false);
    }
  };

  const revoke = async (token: AccessToken) => {
    if (!window.confirm(`Revoke “${token.name}”? Applications using it will immediately lose access.`)) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(authApiUrl(`/api/account/tokens/${encodeURIComponent(token.id)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not revoke the token.'));
        return;
      }
      await load();
    } finally {
      setPending(false);
    }
  };

  const copyToken = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AccountLayout title="Access tokens">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create access token</CardTitle>
            <CardDescription>Use tokens for CI or integrations that cannot complete the browser device login.</CardDescription>
          </CardHeader>
          <form onSubmit={create}>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {createdToken ? (
                <Alert variant="warning">
                  <KeyRound />
                  <AlertTitle>Copy this token now</AlertTitle>
                  <AlertDescription>
                    <p className="mb-3">For security, it will not be shown again.</p>
                    <div className="flex gap-2">
                      <Input className="font-mono text-xs" readOnly value={createdToken} />
                      <Button type="button" size="icon" variant="outline" onClick={() => void copyToken()} aria-label="Copy token">
                        {copied ? <Check /> : <Copy />}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="token-name">Name</Label>
                  <Input id="token-name" name="name" required maxLength={100} placeholder="Production CI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token-scope">Access</Label>
                  <Select value={scope} onValueChange={(value) => setScope(value as typeof scope)}>
                    <SelectTrigger id="token-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registry:read">Read only</SelectItem>
                      {role === 'admin' ? <SelectItem value="registry:write">Read and write</SelectItem> : null}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tokens expire after one year unless revoked earlier.</p>
            </CardContent>
            <CardFooter className="justify-end border-t px-6 py-4">
              <Button type="submit" disabled={pending}>
                Create
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access tokens</CardTitle>
            <CardDescription>Review and revoke credentials issued for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.length ? (
                  tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <p className="font-medium">{token.name}</p>
                        {token.prefix ? <p className="font-mono text-xs text-muted-foreground">{token.prefix}…</p> : null}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {token.scopes.map((item) => (
                          <Badge key={item} variant="secondary">
                            {item === 'registry:write' ? 'Read/write' : 'Read'}
                          </Badge>
                        ))}
                        {token.revokedAt ? <Badge variant="destructive">Revoked</Badge> : null}
                      </TableCell>
                      <TableCell>{formatDate(token.lastUsedAt)}</TableCell>
                      <TableCell>{formatDate(token.expiresAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" disabled={pending || Boolean(token.revokedAt)} onClick={() => void revoke(token)}>
                          <Trash2 /> Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No active access tokens.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
