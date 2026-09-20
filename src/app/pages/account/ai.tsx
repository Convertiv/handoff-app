import { Check, KeyRound, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AccountLayout } from '../../components/Auth/AccountLayout';
import { authApiUrl, readApiError } from '../../components/Auth/api';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

/**
 * `/account/ai`: the one reader-facing setting this feature adds.
 *
 * One list, no add form. Each row is a connection the config declares with `credential: 'user'`,
 * its endpoint and models shown as read-only text. There is no endpoint or model to enter.
 *
 * A key is write-only: once saved, the row shows only that it is configured.
 */

interface AiKeyConnection {
  id: string;
  label: string;
  baseUrl?: string;
  models?: string[];
  configured: boolean;
}

export default function AiKeysPage() {
  if (process.env.HANDOFF_RUNTIME_MODE !== 'registry') {
    return <AccountLayout title="AI providers">{null}</AccountLayout>;
  }

  return <RegistryAiKeysPage />;
}

function RegistryAiKeysPage() {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<AiKeyConnection[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(authApiUrl('/api/account/ai/keys'), { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error(await readApiError(response, 'Could not load AI providers.'));
    const body = (await response.json()) as { connections: AiKeyConnection[] };
    setConnections(body.connections);
  }, []);

  useEffect(() => {
    if (session?.user) void load().catch((reason: Error) => setError(reason.message));
  }, [load, session]);

  const save = async (connection: AiKeyConnection, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const key = String(new FormData(form).get('key') ?? '').trim();
    setPending(connection.id);
    setError(null);
    setSaved(null);
    try {
      const response = await fetch(authApiUrl(`/api/account/ai/keys/${encodeURIComponent(connection.id)}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not save the API key.'));
        return;
      }
      form.reset();
      setSaved(connection.id);
      await load();
    } catch {
      setError('Could not connect to the registry.');
    } finally {
      setPending(null);
    }
  };

  const remove = async (connection: AiKeyConnection) => {
    if (!window.confirm(`Remove your ${connection.label} API key?`)) return;
    setPending(connection.id);
    setError(null);
    setSaved(null);
    try {
      const response = await fetch(authApiUrl(`/api/account/ai/keys/${encodeURIComponent(connection.id)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        setError(await readApiError(response, 'Could not remove the API key.'));
        return;
      }
      await load();
    } finally {
      setPending(null);
    }
  };

  return (
    <AccountLayout title="AI providers">
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">This site does not ask readers for their own AI provider keys.</p>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{connection.label}</CardTitle>
                  {connection.configured && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Configured
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {connection.baseUrl}
                  {connection.models?.length ? ` · ${connection.models.join(', ')}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connection.configured ? (
                  <Button variant="outline" onClick={() => void remove(connection)} disabled={pending === connection.id}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                ) : (
                  <form onSubmit={(event) => void save(connection, event)} className="flex flex-wrap items-center gap-2">
                    <Input
                      name="key"
                      type="password"
                      autoComplete="off"
                      placeholder={`${connection.label} API key`}
                      className="max-w-sm"
                      required
                    />
                    <Button type="submit" disabled={pending === connection.id}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    {saved === connection.id && <span className="text-sm text-muted-foreground">Saved.</span>}
                  </form>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AccountLayout>
  );
}
