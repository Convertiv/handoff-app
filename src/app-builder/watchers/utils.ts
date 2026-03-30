import chokidar from 'chokidar';
import { Logger } from '../../utils/logger';

export interface WatcherState {
  busy: boolean;
  pendingHandlers: Map<string, () => Promise<void>>;
  runtimeComponentsWatcher: chokidar.FSWatcher | null;
  runtimeConfigurationWatcher: chokidar.FSWatcher | null;
  componentDirectoriesWatcher: chokidar.FSWatcher | null;
}

/**
 * Schedules a handler for execution with mutual exclusion and per-source
 * coalescing. When the lock is free the handler runs immediately. When busy,
 * only the latest handler per source key is kept.
 */
export const scheduleHandler = async (
  state: WatcherState,
  source: string,
  handler: () => Promise<void>
): Promise<void> => {
  if (state.busy) {
    state.pendingHandlers.set(source, handler);
    return;
  }

  state.busy = true;
  try {
    await handler();
    while (state.pendingHandlers.size > 0) {
      const entries = Array.from(state.pendingHandlers.entries());
      state.pendingHandlers.clear();
      for (const [pendingSource, pendingHandler] of entries) {
        try {
          await pendingHandler();
        } catch (e) {
          Logger.error(`Unhandled error in scheduled handler for source "${pendingSource}":`, e);
        }
      }
    }
  } finally {
    state.busy = false;
  }
};
