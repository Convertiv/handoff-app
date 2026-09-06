'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';
import CopyToClipboard from '../CopyToClipboard';
import { RuntimeModeBadge } from '../Layout/RuntimeModeBadge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { McpIcon } from './McpIcon';

/**
 * How to point a coding agent at this app's `/api/mcp/` endpoint.
 *
 * Availability comes from values baked in at build time (the `env` block in `next.config.mjs`): a
 * static export has no API routes, and `runtime.mcp: false` leaves the endpoint out of any build.
 * Both mean there is nothing to offer, so this UI is gated on the same value the route is and a
 * build without the endpoint shows no affordance rather than a status dot that reds out on a 404.
 *
 * Registry mode puts `/api/mcp/` behind a `registry:read` credential where a workspace leaves it
 * open. Standalone and Vercel registries need no telling apart: both serve the endpoint from their
 * own origin, which is where the URL comes from.
 */
const isAvailable = process.env.HANDOFF_MCP_ENABLED !== 'false' && process.env.HANDOFF_BUILD_TARGET !== 'static';
const isRegistryRuntime = process.env.HANDOFF_RUNTIME_MODE === 'registry';

/** Placeholder for the reader's own token. No real credential is ever rendered here. */
const CREDENTIAL_HEADERS = { Authorization: 'Bearer <your-token>' };

interface McpTarget {
  url: string;
  headers?: Record<string, string>;
}

/** One server entry, as a client config file carries it. */
interface ServerEntry {
  type?: 'http';
  url: string;
  headers?: Record<string, string>;
}

const httpEntry = ({ url, headers }: McpTarget): ServerEntry => ({ type: 'http', url, ...(headers ? { headers } : {}) });

/** Cursor's remote form is `url` + `headers`; it uses `type` for local stdio servers only. */
const urlEntry = ({ url, headers }: McpTarget): ServerEntry => ({ url, ...(headers ? { headers } : {}) });

interface McpClient {
  id: string;
  name: string;
  /** Where the client reads the config from. */
  configPath: string;
  /** How to reach the same config outside the project. */
  note: string;
  /** The whole config file, in the shape this client expects. */
  file: (name: string, target: McpTarget) => Record<string, unknown>;
  /** Equivalent command line, where the client has one. */
  command?: (name: string, target: McpTarget) => string;
  /** One-click install URL. Only offered when the endpoint needs no credential. */
  deeplink?: (name: string, target: McpTarget) => string;
}

const CLIENTS: McpClient[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    configPath: '.mcp.json',
    note: 'Shared with the project. `--scope user` instead adds it to every project on this machine.',
    file: (name, target) => ({ mcpServers: { [name]: httpEntry(target) } }),
    command: (name, target) =>
      [
        `claude mcp add --transport http ${name} ${target.url}`,
        ...(target.headers ? [`  --header "Authorization: ${target.headers.Authorization}"`] : []),
      ].join(' \\\n'),
  },
  {
    id: 'cursor',
    name: 'Cursor',
    configPath: '.cursor/mcp.json',
    note: 'Project scope. `~/.cursor/mcp.json` instead makes it available in every project.',
    file: (name, target) => ({ mcpServers: { [name]: urlEntry(target) } }),
    deeplink: (name, target) =>
      `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${btoa(JSON.stringify(urlEntry(target)))}`,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    configPath: '.vscode/mcp.json',
    note: 'Workspace scope. "MCP: Open User Configuration" instead makes it available everywhere.',
    file: (name, target) => ({ servers: { [name]: httpEntry(target) } }),
    deeplink: (name, target) => `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name, ...httpEntry(target) }))}`,
  },
];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Name the server after the design system, and mark a registry one. A workspace endpoint serves
 * local build output including unpublished work while a registry serves what was published to it,
 * so both can end up in one config file and the keys must not collide.
 */
const useServerName = (): string => {
  const client = useConfigContext().config?.app?.client;
  return ['handoff', client ? slugify(client) : '', isRegistryRuntime ? 'registry' : ''].filter(Boolean).join('-');
};

/**
 * The endpoint as the reader's own browser reached it, so host, port and base path are never guessed.
 *
 * The trailing slash matters: the app sets `trailingSlash: true`, so a POST to `/api/mcp` gets a 308
 * to `/api/mcp/`. Clients that follow it pay two round trips per call and the ones that don't fail
 * outright, so hand out the URL that answers directly.
 */
const useMcpEndpoint = (): string => {
  const [url, setUrl] = React.useState('');
  React.useEffect(() => {
    setUrl(`${window.location.origin}${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/mcp/`);
  }, []);
  return url;
};

/** What a probe of the endpoint found. */
type EndpointStatus = 'checking' | 'live' | 'unreachable';

// One probe per hard load, cached at module level, so soft navigation does not re-ask and a refresh
// does.
let cachedStatus: EndpointStatus | null = null;
let inFlight: Promise<EndpointStatus> | null = null;

/**
 * Statuses that prove the route is being served. A GET is the cheapest question to ask: the handler
 * answers 405 without ever building an MCP server, and a registry answers 401 ahead of that because
 * the credential check runs first. Anything else, 404 and 5xx included, means it is not there.
 */
const LIVE_STATUSES = new Set([200, 401, 403, 405]);

const probeEndpoint = (url: string): Promise<EndpointStatus> => {
  if (cachedStatus) return Promise.resolve(cachedStatus);
  if (inFlight) return inFlight;
  inFlight = fetch(url, { method: 'GET' })
    .then((res): EndpointStatus => (LIVE_STATUSES.has(res.status) ? 'live' : 'unreachable'))
    .catch((): EndpointStatus => 'unreachable')
    .then((status) => {
      cachedStatus = status;
      return status;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};

const useEndpointStatus = (url: string): EndpointStatus => {
  const [status, setStatus] = React.useState<EndpointStatus>(cachedStatus ?? 'checking');

  React.useEffect(() => {
    if (!url || cachedStatus) return;
    let active = true;
    void probeEndpoint(url).then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, [url]);

  return status;
};

const DOT: Record<EndpointStatus, { className: string; label: string }> = {
  checking: { className: 'bg-muted-foreground/40', label: 'Checking the MCP endpoint' },
  live: { className: 'bg-green-500', label: 'MCP endpoint is live' },
  unreachable: { className: 'bg-red-500', label: 'MCP endpoint is not responding' },
};

const StatusDot: React.FC<{ status: EndpointStatus; className?: string }> = ({ status, className }) => (
  <span role="status" aria-label={DOT[status].label} title={DOT[status].label} className={cn('size-1.5 rounded-full', DOT[status].className, className)} />
);

const Snippet: React.FC<{ label: string; value: string; compact?: boolean }> = ({ label, value, compact }) => (
  <div className="min-w-0 space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <code className="truncate rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{label}</code>
      <CopyToClipboard value={value} tooltip={`Copy ${label}`} showTooltip={false} className="relative size-7 shrink-0" />
    </div>
    <pre
      className={cn(
        'overflow-auto rounded-md border bg-muted/50 p-3 leading-relaxed',
        compact ? 'max-h-48 text-[10px]' : 'max-h-64 text-xs'
      )}
    >
      <code>{value}</code>
    </pre>
  </div>
);

const ClientConfig: React.FC<{ client: McpClient; name: string; target: McpTarget; compact?: boolean }> = ({
  client,
  name,
  target,
  compact,
}) => {
  // A one-click install would write the `<your-token>` placeholder verbatim and register a server
  // that cannot connect, so a registry gets the snippet and the token pointer instead.
  const deeplink = isRegistryRuntime ? undefined : client.deeplink?.(name, target);
  const command = client.command?.(name, target);

  return (
    <div className="min-w-0 space-y-3">
      {deeplink && (
        <Button asChild size="sm" className="w-full gap-2">
          <a href={deeplink}>
            <ExternalLink aria-hidden="true" />
            Install in {client.name}
          </a>
        </Button>
      )}
      {command && <Snippet label="command line" value={command} compact={compact} />}
      <Snippet label={client.configPath} value={JSON.stringify(client.file(name, target), null, 2)} compact={compact} />
      <p className="text-xs text-muted-foreground">{client.note}</p>
    </div>
  );
};

const Endpoint: React.FC<{ url: string; status: EndpointStatus }> = ({ url, status }) => (
  <div className="min-w-0 space-y-1.5">
    <div className="flex flex-wrap items-center justify-between gap-x-2">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <StatusDot status={status} />
        Endpoint
      </p>
      {/* Saying so up front heads off opening the URL in a browser and getting a 405. */}
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">POST · Streamable HTTP</p>
    </div>
    <div className="flex items-stretch overflow-hidden rounded-md border">
      <code className="flex flex-1 items-center truncate px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{url}</code>
      <CopyToClipboard
        value={url}
        tooltip="Copy endpoint"
        showTooltip={false}
        className="relative h-auto w-9 shrink-0 self-stretch rounded-none border-0 border-l shadow-none"
      />
    </div>
  </div>
);

const Credential: React.FC = () => (
  <p className="border-t pt-3 text-xs text-muted-foreground">
    Needs an access token — read-only access is enough.{' '}
    <Link href="/account/tokens" className="font-medium text-foreground underline">
      Create one in Account settings
    </Link>
    .
  </p>
);

/** Endpoint, per-client config and credential guidance. Shared by the dialog and the mobile nav. */
const ConnectionDetails: React.FC<{ url: string; status: EndpointStatus; compact?: boolean }> = ({ url, status, compact }) => {
  const name = useServerName();
  const target: McpTarget = { url, headers: isRegistryRuntime ? CREDENTIAL_HEADERS : undefined };

  return (
    <div className="min-w-0 space-y-4">
      <Endpoint url={url} status={status} />
      <Tabs defaultValue={CLIENTS[0].id} className="min-w-0">
        <TabsList className="w-full">
          {CLIENTS.map((client) => (
            <TabsTrigger key={client.id} value={client.id} className="flex-1 text-xs">
              {client.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {CLIENTS.map((client) => (
          <TabsContent key={client.id} value={client.id} className="min-w-0">
            <ClientConfig client={client} name={name} target={target} compact={compact} />
          </TabsContent>
        ))}
      </Tabs>
      {isRegistryRuntime && <Credential />}
    </div>
  );
};

const mode = isRegistryRuntime ? 'registry' : 'workspace';

const DESCRIPTION =
  "This app serves an MCP endpoint, so a coding agent can read the components and tokens that already exist instead of inventing markup and values.";

export function McpConfigDialog() {
  return isAvailable ? <McpDialog /> : null;
}

const McpDialog: React.FC = () => {
  const url = useMcpEndpoint();
  const status = useEndpointStatus(url);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Connect a coding agent">
          <McpIcon className="h-[1.2rem] w-[1.2rem]" />
          <StatusDot status={status} className="absolute right-1.5 top-1.5" />
          <span className="sr-only">Connect a coding agent</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>Connect a coding agent</DialogTitle>
            <RuntimeModeBadge mode={mode} />
          </div>
          <DialogDescription>{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <ConnectionDetails url={url} status={status} />
      </DialogContent>
    </Dialog>
  );
};

/**
 * Inline variant for the mobile nav, which is itself a sheet, so a nested dialog would sit on top of
 * it. It owns its divider, so a build without the endpoint renders nothing and leaves no stray rule.
 */
export function McpConfigMobile() {
  return isAvailable ? <McpMobile /> : null;
}

const McpMobile: React.FC = () => {
  const url = useMcpEndpoint();
  const status = useEndpointStatus(url);

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <McpIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Connect a coding agent</span>
        <RuntimeModeBadge mode={mode} />
      </div>
      <ConnectionDetails url={url} status={status} compact />
    </div>
  );
};
