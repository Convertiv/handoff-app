import { aiCredentialKind, parseAiModelId, type AiConnectionSettings } from '@handoff/ai/connections';
import type { AiCredentialKind } from '@handoff/types/config';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';

/**
 * Per-request AI connection resolution.
 *
 * Reports what the config declared and whether a usable key exists for the current reader. The key
 * value itself never leaves the server: the browser only ever learns `configured`.
 */

/** One connection as the browser sees it. */
export interface ResolvedAiConnection {
  id: string;
  label: string;
  /** Absent for a connection served by a `defineAiProvider()` module rather than a base URL. */
  baseUrl?: string;
  models?: string[];
  credential: AiCredentialKind;
  /**
   * Whether this reader can use the connection right now: the deployment's key is set, the endpoint
   * needs none, or the reader has saved their own.
   */
  configured: boolean;
}

/** Find a declared connection by id. Ids only ever come from the resolved list, never from a reader. */
export const findAiConnection = (connectionId: string): AiConnectionSettings | undefined =>
  getServerRuntimeConfig().ai.connections.find((connection) => connection.id === connectionId);

/**
 * Read this reader's saved connection ids. Registry mode only — a workspace has one user, whose
 * config file and `.env` are their user layer, so it has no per-user key store.
 *
 * The registry data layer is imported lazily so the Drizzle/Postgres dependencies stay out of the
 * workspace path, the same way the rest of the registry runtime is reached.
 */
const readSavedConnections = async (userId: string | null): Promise<Set<string>> => {
  if (!userId || getServerRuntimeConfig().mode !== 'registry') return new Set();
  const [{ getRegistryConnection }, { listRegistryAiKeyConnections }] = await Promise.all([
    import('../registry-connection'),
    import('@handoff/registry/auth'),
  ]);
  const { db } = await getRegistryConnection();
  return new Set(await listRegistryAiKeyConnections(db, userId));
};

/** Whether a connection is usable for a reader, given the keys that reader has saved. */
const isConfigured = (connection: AiConnectionSettings, saved: ReadonlySet<string>): boolean => {
  switch (aiCredentialKind(connection)) {
    case 'service':
      return Boolean(connection.apiKeyEnv && process.env[connection.apiKeyEnv]?.trim());
    case 'user':
      return saved.has(connection.id);
    default:
      return true;
  }
};

/** Every declared connection, each marked with whether this reader can use it. */
export const describeAiConnections = async (userId: string | null): Promise<ResolvedAiConnection[]> => {
  const { ai } = getServerRuntimeConfig();
  const saved = await readSavedConnections(userId);
  return ai.connections.map((connection) => ({
    id: connection.id,
    label: connection.label,
    ...(connection.baseUrl ? { baseUrl: connection.baseUrl } : {}),
    ...(connection.models?.length ? { models: connection.models } : {}),
    credential: aiCredentialKind(connection),
    configured: isConfigured(connection, saved),
  }));
};

/** The connections a reader may add a key for. Empty when the config declares none. */
export const describeAiUserConnections = async (userId: string | null): Promise<ResolvedAiConnection[]> =>
  (await describeAiConnections(userId)).filter((connection) => connection.credential === 'user');

/**
 * The model to run, given what the reader asked for. A requested model must name a declared
 * connection and one of that connection's declared models, so a reader can never reach a model the
 * deployment did not list. Falls back to `defaultModel`, then to the first usable model.
 */
export const selectAiModel = (
  connections: readonly ResolvedAiConnection[],
  requested: string | undefined
): { connection: ResolvedAiConnection; model: string } | null => {
  const usable = connections.filter((connection) => connection.configured && connection.models?.length);
  const pick = (value: string | undefined) => {
    const parsed = value ? parseAiModelId(value) : null;
    if (!parsed) return null;
    const connection = usable.find((candidate) => candidate.id === parsed.connectionId);
    return connection?.models?.includes(parsed.model) ? { connection, model: parsed.model } : null;
  };
  const { ai } = getServerRuntimeConfig();
  const first = usable[0];
  return pick(requested) ?? pick(ai.defaultModel) ?? (first?.models?.[0] ? { connection: first, model: first.models[0] } : null);
};
