/**
 * AI connection resolution.
 *
 * `runtime.ai.connections` declares the whole surface a reader can reach. Mirrors
 * {@link import('../registry/asset-storage/resolve')}: only provider selection, module location,
 * non-secret options, and env-var *names* are ever persisted; secret *values* are read from
 * `process.env` at request time.
 *
 * The list is deployment data rather than build shape, so `HANDOFF_AI_CONNECTIONS` can extend or
 * replace the baked list at request time. A registry is built once and redeployed many times, and a
 * new gateway should not need a rebuild.
 */

import { HandoffConfigError } from '../config/errors';
import type { AiCredentialKind, HandoffAiConnection, ResolvedConfig } from '../types/config';

/** A connection as it is baked and read back: env-var names, never secret values. */
export interface AiConnectionSettings {
  id: string;
  label: string;
  baseUrl?: string;
  module?: string;
  /** Name of the env var holding the deployment's own key. Its presence marks a service connection. */
  apiKeyEnv?: string;
  credential?: 'user';
  models?: string[];
  options?: Record<string, unknown>;
}

/** The resolved AI block: whether this build serves the assistant, and what it can reach. */
export interface AiSettings {
  enabled: boolean;
  connections: AiConnectionSettings[];
  defaultModel?: string;
}

/** A connection id addresses a model as `<id>/<model>`, so it cannot itself contain a slash. */
const isUsableId = (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0 && !id.includes('/');

/**
 * Which of the three credential states a connection declares. Derived from the declaration, never
 * from a missing key: without the explicit `user` state, a connection that needs a reader's key
 * would be indistinguishable from one that needs none.
 */
export const aiCredentialKind = (connection: AiConnectionSettings): AiCredentialKind => {
  if (connection.credential === 'user') return 'user';
  return connection.apiKeyEnv ? 'service' : 'none';
};

/** Split `<connectionId>/<model>`. Only the first slash separates them, since model ids carry slashes. */
export const parseAiModelId = (value: string): { connectionId: string; model: string } | null => {
  const separator = value.indexOf('/');
  if (separator <= 0 || separator === value.length - 1) return null;
  return { connectionId: value.slice(0, separator), model: value.slice(separator + 1) };
};

/** Join a connection id and a model into the address the client sends back. */
export const formatAiModelId = (connectionId: string, model: string): string => `${connectionId}/${model}`;

/** Normalize one authored or deployment-supplied connection, dropping anything unusable. */
const toConnectionSettings = (input: unknown): AiConnectionSettings | null => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  if (!isUsableId(raw.id)) return null;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : undefined;
  const module = typeof raw.module === 'string' ? raw.module.trim() : undefined;
  if (!baseUrl && !module) return null;
  // An authored config carries `apiKey` as a deferred `{ $env }` reference; a baked or
  // deployment-supplied list carries the name it resolved to.
  const reference = raw.apiKey as { $env?: unknown } | undefined;
  const apiKeyEnv =
    typeof raw.apiKeyEnv === 'string' && raw.apiKeyEnv.trim()
      ? raw.apiKeyEnv.trim()
      : typeof reference?.$env === 'string'
        ? reference.$env
        : undefined;
  const models = Array.isArray(raw.models)
    ? raw.models.filter((model): model is string => typeof model === 'string' && !!model.trim())
    : [];
  const options =
    raw.options && typeof raw.options === 'object' && !Array.isArray(raw.options) ? (raw.options as Record<string, unknown>) : undefined;

  return {
    id: raw.id.trim(),
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : raw.id.trim(),
    ...(baseUrl ? { baseUrl } : {}),
    ...(module ? { module } : {}),
    ...(apiKeyEnv ? { apiKeyEnv } : {}),
    ...(raw.credential === 'user' ? { credential: 'user' as const } : {}),
    ...(models.length ? { models } : {}),
    ...(options ? { options } : {}),
  };
};

/** Normalize a declared list, keeping the first entry for any repeated id. */
const toConnectionList = (input: readonly unknown[] | undefined): AiConnectionSettings[] => {
  const byId = new Map<string, AiConnectionSettings>();
  for (const entry of input ?? []) {
    const connection = toConnectionSettings(entry);
    if (connection && !byId.has(connection.id)) byId.set(connection.id, connection);
  }
  return [...byId.values()];
};

/**
 * Merge a deployment-supplied list over the baked one by `id`: a matching id replaces the baked
 * connection outright, and a new id is appended. Replacement rather than a field-wise merge, so a
 * deployment that repoints a gateway cannot leave a stale model list or key name behind.
 */
export const mergeAiConnections = (
  baked: readonly AiConnectionSettings[],
  overrides: readonly AiConnectionSettings[]
): AiConnectionSettings[] => {
  const byId = new Map(baked.map((connection) => [connection.id, connection]));
  for (const connection of overrides) byId.set(connection.id, connection);
  return [...byId.values()];
};

/** Parse the `HANDOFF_AI_CONNECTIONS` JSON array. A malformed value is ignored rather than fatal. */
export const parseAiConnections = (raw: string | undefined): AiConnectionSettings[] => {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? toConnectionList(parsed) : [];
  } catch {
    return [];
  }
};

/**
 * Whether this build serves the assistant. The `ai` block is the opt-in; `enabled: false` turns it
 * back off. Config-only and baked, like `runtime.mcp`.
 */
export const isAiEnabled = (config: Pick<ResolvedConfig, 'runtime'> | null | undefined): boolean =>
  Boolean(config?.runtime?.ai) && config?.runtime?.ai?.enabled !== false;

/**
 * Resolve the AI settings from a loaded config (CLI/build side).
 *
 * An authored connection that cannot be used fails the build rather than disappearing. A deployment
 * list stays lenient by contrast: a bad `HANDOFF_AI_CONNECTIONS` entry must not take the server down.
 */
export const resolveAiFromConfig = (config: ResolvedConfig | null | undefined): AiSettings => {
  const authored = (config?.runtime?.ai?.connections ?? []) as readonly HandoffAiConnection[];
  const fail = (problem: string, ids: readonly unknown[]): never => {
    throw new HandoffConfigError(
      `Config "runtime.ai.connections": ${problem} (${ids.map((id) => JSON.stringify(id ?? null)).join(', ')}).`
    );
  };

  const normalized = authored.map((connection) => ({ authored: connection, settings: toConnectionSettings(connection) }));
  const unusable = normalized.filter((entry) => !entry.settings);
  if (unusable.length > 0) {
    fail(
      'every connection needs an "id" without a slash, and either a "baseUrl" or a "module"',
      unusable.map((entry) => entry.authored?.id)
    );
  }

  const ids = normalized.map((entry) => entry.settings!.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    fail('a connection id must be unique, because it is half of every model address', duplicates);
  }

  return {
    enabled: isAiEnabled(config),
    connections: normalized.map((entry) => entry.settings!),
    defaultModel: config?.runtime?.ai?.defaultModel?.trim() || undefined,
  };
};
