import type { RegistryBuildStatus } from '@handoff/registry/db/schema';

const REGISTRY_BUILD_STATUSES: readonly RegistryBuildStatus[] = ['current', 'stale', 'missing', 'error'];

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

export const isRegistryBuildStatus = (value: unknown): value is RegistryBuildStatus =>
  typeof value === 'string' && REGISTRY_BUILD_STATUSES.includes(value as RegistryBuildStatus);
