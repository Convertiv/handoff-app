/** Serialize a value with object keys sorted at every nesting level. */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_, nestedValue) =>
    nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)
      ? Object.fromEntries(Object.entries(nestedValue).sort(([left], [right]) => left.localeCompare(right)))
      : nestedValue
  );
