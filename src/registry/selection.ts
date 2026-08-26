/**
 * Selection narrowing shared by the publish and checkout orchestration.
 *
 * Every bulk operation discovers what is available (declared locally or published remotely) and may
 * be asked for only part of it. Splitting the request into what exists and what does not lets each
 * caller build its own actionable error while the matching lives in one place.
 */

/** Narrow an available list to the requested subset, separating out ids that do not exist. */
export const selectIds = (available: string[], requested?: string[]): { selected: string[]; unknown: string[] } => {
  if (!requested) {
    return { selected: available, unknown: [] };
  }
  const availableIds = new Set(available);
  return {
    selected: requested.filter((id) => availableIds.has(id)),
    unknown: requested.filter((id) => !availableIds.has(id)),
  };
};
