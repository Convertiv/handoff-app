/** outerKey -> Map<innerKey, serializedValue> */
export type MapSnapshot = Map<string, Map<string, string>>;

export { stableStringify } from '../../utils/stable-stringify';

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
