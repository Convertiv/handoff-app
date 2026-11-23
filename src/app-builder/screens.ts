import chokidar from 'chokidar';
import Handoff from '..';
import { resolveScreenDeclarations, type ScreenFiles } from '../screens/build/declarations';
import { generateScreens, type ScreensContext } from '../screens/build/generate';
import { Logger } from '../utils/logger';
import type { WatcherState } from './watchers/utils';

/**
 * Screens in the staged app: generation for every build, and the watcher for `start`.
 *
 * Next compiles the screen files themselves, so an edit to `index.tsx`, `collections.ts`,
 * `options.ts` or `tools.ts` reaches the dev server through its own hot reload. The watcher regenerates only the
 * four generated files. They change when a screen's title, icon, access, collections or tools
 * change, or when a file is added or removed.
 */

const contextOf = (handoff: Handoff): ScreensContext => ({
  workingPath: handoff.workingPath,
  modulePath: handoff.modulePath,
  config: handoff.config,
});

/** The declared screens, or none when the config is invalid. The build reports why. */
const declaredScreens = (handoff: Handoff): ScreenFiles[] => {
  try {
    return resolveScreenDeclarations(handoff.config?.screens, handoff.workingPath);
  } catch {
    return [];
  }
};

/** The packages that provide screens. Next compiles them with the app. */
export const screenPackages = (handoff: Handoff): string[] =>
  [...new Set(declaredScreens(handoff).flatMap((screen) => (screen.packageName ? [screen.packageName] : [])))].sort();

/** Generate the screen files into the staged app. Throws `ScreenBuildError` listing every screen problem. */
export const generateAppScreens = async (handoff: Handoff, appPath: string): Promise<void> => {
  const { manifest } = await generateScreens(contextOf(handoff), appPath);
  if (manifest.screens.length > 0) Logger.info(`Checked ${manifest.screens.length} screen${manifest.screens.length === 1 ? '' : 's'}.`);
};

/**
 * Watch the screen directories and keep the generated files current.
 *
 * The runtime configuration watcher calls `state.refreshScreens` after each config reload. A timer
 * here would race that reload, which waits behind any running component build, and regenerate from
 * the old config.
 */
export const watchScreens = (handoff: Handoff, appPath: string, state: WatcherState): void => {
  let watcher: chokidar.FSWatcher | null = null;
  let watchedDirectoriesKey = '';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Runs in sequence, so the last run writes the latest config.
  let queue: Promise<void> = Promise.resolve();

  // Workspace screens only. A package changes on install, which needs a restart.
  const directories = (): string[] => declaredScreens(handoff).flatMap((screen) => (screen.packageName ? [] : [screen.dir]));

  const syncWatcher = () => {
    const watched = directories();
    const key = watched.join('\n');
    if (key === watchedDirectoriesKey) return;
    watchedDirectoriesKey = key;
    void watcher?.close();
    watcher = null;
    if (watched.length === 0) return;
    watcher = chokidar
      .watch(watched, { ignoreInitial: true, ignored: /(^|[/\\])(node_modules|\..+)([/\\]|$)|\.tmp$/ })
      .on('all', () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => void regenerate(), 50);
      });
  };

  // Next reads the package list at startup, so a change needs a restart.
  const startPackages = screenPackages(handoff).join('\n');
  const generate = async () => {
    if (screenPackages(handoff).join('\n') !== startPackages) {
      Logger.warn('Screen packages changed. Restart to compile them.');
    }
    try {
      const { changed } = await generateScreens(contextOf(handoff), appPath);
      if (changed) Logger.success('Screens updated.');
    } catch (error) {
      // The dev server keeps the last good files; the next save tries again.
      Logger.error(error instanceof Error ? error.message : String(error));
    }
    syncWatcher();
  };

  const regenerate = (): Promise<void> => (queue = queue.then(generate));

  state.refreshScreens = regenerate;
  syncWatcher();
};
