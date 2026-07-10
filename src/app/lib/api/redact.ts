/**
 * Defensive secret redaction for registry and docs API responses.
 *
 * Config stores only env-var *names*, never secret values, so well-formed records should never
 * carry a token or connection string. This is a belt-and-braces final pass over every response
 * body: any string property whose key looks like a secret has its value replaced with
 * `[redacted]`, so an accidentally-stored secret can never leak through the API.
 */

const SECRET_KEY_PATTERN =
  /(token|secret|password|passwd|api[_-]?key|access[_-]?token|connection[_-]?string|database[_-]?url|authorization|bearer|credential)/i;

const REDACTED = '[redacted]';

/**
 * Recursively clone `value`, replacing string values whose keys look secret with `[redacted]`.
 * Arrays and nested objects are cloned, and cycles are replaced with a serializable marker.
 */
export const redactSecrets = <T>(value: T, ancestors: WeakSet<object> = new WeakSet()): T => {
  if (Array.isArray(value)) {
    if (ancestors.has(value)) {
      return '[circular]' as T;
    }
    ancestors.add(value);
    const result = value.map((item) => redactSecrets(item, ancestors));
    ancestors.delete(value);
    return result as T;
  }
  if (value && typeof value === 'object') {
    if (ancestors.has(value as object)) {
      return '[circular]' as T;
    }
    ancestors.add(value as object);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'string' && SECRET_KEY_PATTERN.test(key)) {
        result[key] = REDACTED;
      } else {
        result[key] = redactSecrets(val, ancestors);
      }
    }
    ancestors.delete(value as object);
    return result as T;
  }
  return value;
};
