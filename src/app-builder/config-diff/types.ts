import Handoff from '../..';

/**
 * Handle returned by ConfigDiffStrategy.capture().
 *
 * Captures the pre-reload state in a closure so the snapshot type stays
 * fully encapsulated and the watcher only sees this opaque handle.
 */
export interface RebuildHandle {
  apply(handoff: Handoff, entityIdAfterReload: string | undefined): Promise<void>;
}

/**
 * Encapsulates the snapshot -> reload -> diff -> selective-rebuild protocol
 * for a single config-file entity kind.
 */
export interface ConfigDiffStrategy {
  readonly kind: string;
  capture(handoff: Handoff, entityId: string): RebuildHandle;
  finalize(handoff: Handoff): Promise<void>;
}
