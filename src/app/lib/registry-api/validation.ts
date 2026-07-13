import type { ArtifactBuildStatus } from '@handoff/artifacts/types';
import { isSafeRelativePath, normalizeRelativePath } from '@handoff/registry/path';
import type { TransferBuild } from '@handoff/registry/transfer';
import type { RegistryErrorDetails } from './errors';

const REGISTRY_BUILD_STATUSES: readonly ArtifactBuildStatus[] = ['current', 'stale', 'missing', 'error'];

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const isRegistryBuildStatus = (value: unknown): value is ArtifactBuildStatus =>
  typeof value === 'string' && REGISTRY_BUILD_STATUSES.includes(value as ArtifactBuildStatus);

export const normalizeSafeRelativePath = (value: unknown): string | undefined => {
  const candidate = asString(value);
  return candidate && isSafeRelativePath(candidate) ? normalizeRelativePath(candidate) : undefined;
};

export const isSha256Hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);

export interface PackageValidation<T> {
  ok: boolean;
  message?: string;
  details?: RegistryErrorDetails;
  value?: T;
}

export const invalidPackage = <T = never>(message: string, details?: RegistryErrorDetails): PackageValidation<T> => ({
  ok: false,
  message,
  details,
});

interface TransferBuildValidationOptions {
  currentMessage: string;
  requiredHashField: 'artifactHash' | 'sourceHash';
}

/** Validate and normalize the build block shared by entity, token, and asset transfer packages. */
export const validateTransferBuild = (value: unknown, options: TransferBuildValidationOptions): PackageValidation<TransferBuild> => {
  if (!isPlainObject(value)) {
    return invalidPackage('`build` metadata is required to publish.', { rejectedFields: ['build'] });
  }

  const status = value.status;
  if (!isRegistryBuildStatus(status)) {
    return invalidPackage('`build.status` must be one of current|stale|missing|error.', {
      rejectedFields: ['build.status'],
    });
  }

  const build: TransferBuild = {
    status,
    builtAt: asString(value.builtAt),
    builderVersion: asString(value.builderVersion),
    artifactHash: asString(value.artifactHash),
    sourceHash: asString(value.sourceHash),
    warnings:
      Array.isArray(value.warnings) && value.warnings.every((warning) => typeof warning === 'string')
        ? (value.warnings as string[])
        : undefined,
    error: asString(value.error),
  };

  if (status === 'current' && (!build.builtAt || !build.builderVersion || !build[options.requiredHashField])) {
    return invalidPackage(options.currentMessage, {
      rejectedFields: ['build.builtAt', 'build.builderVersion', `build.${options.requiredHashField}`],
    });
  }

  return { ok: true, value: build };
};
