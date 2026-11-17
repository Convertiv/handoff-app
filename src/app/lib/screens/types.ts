/**
 * Shapes of the generated screen files. Kept loose on purpose: a screen module is typed by the
 * `handoff-app/screens` declarations in the consumer's `node_modules`, and the app checks its
 * exports at runtime instead of asking two copies of the same types to agree.
 */
export type ScreenLoaders = Record<string, () => Promise<{ default?: unknown }>>;

export type ScreenServerModules = Record<string, { collections?: Record<string, unknown>; tools?: unknown }>;
