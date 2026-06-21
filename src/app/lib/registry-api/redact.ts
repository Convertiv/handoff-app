/**
 * Defensive secret redaction for registry API responses (technical design §9; PRD story 162).
 *
 * Config stores only env-var *names*, never secret values, so well-formed records should never
 * carry a token or connection string. This is a belt-and-braces final pass over every response
 * body: any object property whose key looks like a secret has its string value replaced with
 * `[redacted]`, so an accidentally-stored secret can never leak through the API.
 */

const SECRET_KEY_PATTERN =
  /(token|secret|password|passwd|api[_-]?key|access[_-]?token|connection[_-]?string|database[_-]?url|authorization|bearer|credential)/i;

const REDACTED = '[redacted]';

/**
 * Recursively clone `value`, replacing the string value of any secret-looking key with `[redacted]`.
 * Arrays and nested objects are walked; non-string secret values are left structurally intact (only
 * leaked *string* secrets are the concern here). Cycles are guarded against with a seen-set.
 */
export const redactSecrets = <T>(value: T, seen: WeakSet<object> = new WeakSet()): T => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, seen)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    if (seen.has(value as object)) {
      return value;
    }
    seen.add(value as object);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'string' && SECRET_KEY_PATTERN.test(key)) {
        result[key] = REDACTED;
      } else {
        result[key] = redactSecrets(val, seen);
      }
    }
    return result as T;
  }
  return value;
};
