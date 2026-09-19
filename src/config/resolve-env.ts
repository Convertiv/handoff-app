import isPlainObject from 'lodash/isPlainObject';
import type { Config, ResolvedConfig } from '../types/config';
import { Logger } from '../utils/logger';
import { isEnvReference } from './from-env';
import { HandoffConfigError } from './errors';

export const DEFERRED_PATHS = new Set(['runtime.registry.databaseUrl', 'runtime.registry.assetStorage.token']);
const SECRET_PATHS = new Set(['dev_access_token', 'devAccessToken', 'runtime.registryConnection.accessToken']);
/** Path prefixes whose resolved contents are JSON-baked into the bundle, so a reference would bake its value. */
const BAKED_PATHS = ['runtime.registry.assetStorage.options'];
const isBaked = (path: string): boolean => BAKED_PATHS.some((baked) => path === baked || path.startsWith(`${baked}.`));
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ALIASES: Record<string, string> = {
  HANDOFF_REGISTRY_URL: 'HANDOFF_CLOUD_URL',
  HANDOFF_REGISTRY_ACCESS_TOKEN: 'HANDOFF_CLOUD_TOKEN',
};
const warnedAliases = new Set<string>();
const referenceNames = new WeakMap<ResolvedConfig, Map<string, string>>();

export const configEnvName = (config: ResolvedConfig | null | undefined, path: string): string | undefined =>
  referenceNames.get(config)?.get(path);

const readEnv = (name: string): string | undefined => {
  const value = process.env[name];
  const alias = ALIASES[name];
  if (!alias || value?.trim()) return value;
  const inherited = process.env[alias];
  if (!inherited?.trim()) return value;
  if (!warnedAliases.has(alias)) {
    warnedAliases.add(alias);
    Logger.warn(`${alias} is deprecated and will be removed in a future release; set ${name} instead.`);
  }
  return inherited;
};

/** Resolve only the merged winner. Functions and non-plain objects retain their identity. */
export const resolveConfigEnv = (config: Config, profile?: string, defaults?: Config): ResolvedConfig => {
  const names = new Map<string, string>();
  const fail = (path: string, message: string): never => {
    throw new HandoffConfigError(`Config "${path}" (profile "${profile ?? 'default'}"): ${message}`);
  };
  const walk = (value: unknown, path: string, seed?: unknown): unknown => {
    const deferred = DEFERRED_PATHS.has(path);
    const secret = SECRET_PATHS.has(path);
    if ((secret || deferred) && value !== undefined && !isEnvReference(value)) {
      fail(path, 'Expected an environment reference, such as { $env: "VARIABLE_NAME" }. Literal values are not allowed.');
    }
    if (isEnvReference(value)) {
      // Checked before the name, so the message names the supported pattern instead of the reference shape.
      if (isBaked(path)) {
        fail(
          path,
          'Environment references are not allowed here because the resolved value is baked into the build. ' +
            "Put the variable name in options and read it through the adapter factory's `env` argument."
        );
      }
      if (typeof value.$env !== 'string' || !ENV_NAME.test(value.$env)) {
        fail(path, 'Invalid environment variable name. Use letters, digits, and underscores, starting with a letter or underscore.');
      }
      const name = value.$env;
      names.set(path, name);
      if (Object.keys(value).some((key) => key !== '$env' && key !== 'default')) {
        fail(path, `Environment variable "${name}" has an invalid reference shape.`);
      }
      if (deferred) {
        if ('default' in value) fail(path, `Environment variable "${name}" cannot have a default because it is read by the deployed app.`);
        return { $env: name };
      }
      // Secret defaults can mark an optional credential, but cannot embed a credential value.
      if (secret && value.default !== undefined && value.default !== null && value.default !== '') {
        fail(path, `Environment variable "${name}" cannot have a literal secret default.`);
      }
      const raw = readEnv(name);
      if (raw === undefined) {
        if (Object.prototype.hasOwnProperty.call(value, 'default')) return secret ? value.default : walk(value.default, path, seed);
        fail(path, `Environment variable "${name}" is not set and has no default.`);
      }
      const typeHint = value.default ?? (isEnvReference(seed) ? seed.default : seed);
      if (typeof typeHint === 'boolean') return raw === 'true';
      if (typeof typeHint === 'number') {
        const number = Number(raw);
        if (!Number.isFinite(number)) fail(path, `Environment variable "${name}" must contain a finite number.`);
        return number;
      }
      return raw;
    }
    if (Array.isArray(value)) return value.map((entry, index) => walk(entry, `${path}.${index}`, seed?.[index]));
    if (!isPlainObject(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, walk(entry, path ? `${path}.${key}` : key, seed?.[key])]));
  };
  const resolved = walk(config, '', defaults) as ResolvedConfig;
  referenceNames.set(resolved, names);
  return resolved;
};
