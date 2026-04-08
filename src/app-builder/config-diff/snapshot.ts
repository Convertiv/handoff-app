/** outerKey -> Map<innerKey, serializedValue> */
export type MapSnapshot = Map<string, Map<string, string>>;

/**
 * Deterministic JSON serializer that sorts object keys at every nesting level.
 * Prevents false-positive diffs when identical values are constructed with
 * different key insertion order across reloads.
 */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );

/**
 * Compares two MapSnapshots and returns the outer keys where the inner maps
 * differ (added, removed, or values changed).
 */
export const diffMapSnapshots = (
  oldSnapshot: MapSnapshot,
  newSnapshot: MapSnapshot
): string[] => {
  const affected = new Set<string>();

  for (const [key, oldEntries] of Array.from(oldSnapshot)) {
    const newEntries = newSnapshot.get(key);
    if (!newEntries) {
      affected.add(key);
      continue;
    }
    if (oldEntries.size !== newEntries.size) {
      affected.add(key);
      continue;
    }
    for (const [subKey, oldValue] of Array.from(oldEntries)) {
      if (newEntries.get(subKey) !== oldValue) {
        affected.add(key);
        break;
      }
    }
  }

  for (const key of Array.from(newSnapshot.keys())) {
    if (!oldSnapshot.has(key)) {
      affected.add(key);
    }
  }

  return Array.from(affected);
};
