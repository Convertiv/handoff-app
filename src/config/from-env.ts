/** A JSON-compatible environment reference. Creating one never reads the environment. */
export type EnvReference<T> = { $env: string; default?: T };

/**
 * Use for values that can be literals or environment references, such as output directories.
 * References resolve at config load; ResolvedConfig holds the value.
 */
export type EnvValue<T> = T | EnvReference<T>;

/**
 * Use for credentials the CLI needs, such as the Figma token. Only references are allowed.
 * References resolve at config load; ResolvedConfig holds the secret value.
 */
export type EnvSecret<T> = EnvReference<T>;

/**
 * Use for values the deployed app reads, such as its database URL. Only references are allowed.
 * ResolvedConfig keeps the reference; the build stores its name, and the deployed app reads the value at runtime.
 */
export type RuntimeEnvReference<T> = EnvReference<T>;

export const fromEnv = <T = string>(name: string, options?: { default: T }): EnvReference<T> =>
  options === undefined ? { $env: name } : { $env: name, default: options.default };

export const isEnvReference = (value: unknown): value is EnvReference<unknown> =>
  value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, '$env');

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Replace each reference nested in `options` with its value from `env`. An unset or empty variable becomes `undefined`. */
export const resolveEnvReferences = (options: Record<string, unknown>, env: NodeJS.ProcessEnv): Record<string, unknown> => {
  const resolve = (value: unknown): unknown => {
    if (isEnvReference(value)) {
      const resolved = typeof value.$env === 'string' ? env[value.$env]?.trim() : undefined;
      return resolved || undefined;
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (isPlainRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolve(entry)]));
    return value;
  };
  return resolve(options) as Record<string, unknown>;
};

/** The variable names that the references nested in `options` use, for deployment instructions. */
export const envReferenceNames = (options: Record<string, unknown>): string[] => {
  const names = new Set<string>();
  const collect = (value: unknown): void => {
    if (isEnvReference(value)) {
      if (typeof value.$env === 'string') names.add(value.$env);
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (isPlainRecord(value)) {
      Object.values(value).forEach(collect);
    }
  };
  collect(options);
  return [...names];
};
