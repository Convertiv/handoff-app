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
