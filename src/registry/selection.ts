/**
 * Selection narrowing shared by the publish and checkout orchestration.
 *
 * Every bulk operation discovers what is available (declared locally or published remotely) and may
 * be asked for only part of it. Splitting the request into what exists and what does not lets each
 * caller build its own actionable error while the matching lives in one place.
 *
 * A catalog request needs one more step. A catalog item normalizes into a component or a pattern
 * from its declaration, so the CLI names the item and the lane is looked up here.
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

/** Catalog item ids grouped by lane. */
export interface CatalogLanes {
  component: string[];
  pattern: string[];
}

/**
 * Route each requested catalog id to its lane. The two lanes are keyed separately, so nothing stops a
 * workspace from declaring one id twice. Such an id is reported rather than guessed, because picking
 * a lane silently would act on the wrong entity.
 */
export const splitCatalogIds = (
  requested: string[],
  available: CatalogLanes
): { lanes: CatalogLanes; unknown: string[]; ambiguous: string[] } => {
  const components = new Set(available.component);
  const patterns = new Set(available.pattern);
  const lanes: CatalogLanes = { component: [], pattern: [] };
  const unknown: string[] = [];
  const ambiguous: string[] = [];

  for (const id of requested) {
    const isComponent = components.has(id);
    const isPattern = patterns.has(id);
    if (isComponent && isPattern) {
      ambiguous.push(id);
    } else if (isComponent) {
      lanes.component.push(id);
    } else if (isPattern) {
      lanes.pattern.push(id);
    } else {
      unknown.push(id);
    }
  }

  return { lanes, unknown, ambiguous };
};

/** Quote ids for an error message: `"button", "card"`. */
export const quoteIds = (ids: string[]): string => ids.map((id) => `"${id}"`).join(', ');
