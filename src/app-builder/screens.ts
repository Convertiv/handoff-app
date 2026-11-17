import chokidar from 'chokidar';
import path from 'path';
import Handoff from '..';
import { generateScreens, type ScreensContext } from '../screens/build/generate';
import { Logger } from '../utils/logger';

/**
 * Screens in the staged app: generation for every build, and the watcher for `start`.
 *
 * Next compiles the screen files themselves, so an edit to `index.tsx`, `collections.ts` or
 * `tools.ts` reaches the dev server through its own hot reload. The watcher regenerates only the
 * four generated files. They change when a screen's title, icon, access, collections or tools
 * change, or when a file is added or removed.
 */

const contextOf = (handoff: Handoff): ScreensContext => ({
  workingPath: handoff.workingPath,
  modulePath: handoff.modulePath,
  config: handoff.config,
});

/** Generate the screen files into the staged app. Throws `ScreenBuildError` listing every screen problem. */
export const generateAppScreens = async (handoff: Handoff, appPath: string): Promise<void> => {
  const { manifest } = await generateScreens(contextOf(handoff), appPath);
  if (manifest.screens.length > 0) Logger.info(`Checked ${manifest.screens.length} screen${manifest.screens.length === 1 ? '' : 's'}.`);
};

const MAIN_CONFIG_SETTLE_MS = 400;

/** Watch the screen directories and the main config; keep the generated files current. */
export const watchScreens = (handoff: Handoff, appPath: string): void => {
  let watcher: chokidar.FSWatcher | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const directories = (): string[] =>
    (Array.isArray(handoff.config?.screens) ? handoff.config.screens : [])
      .map((screen) => (typeof screen?.module === 'string' ? path.resolve(handoff.workingPath, screen.module) : null))
      .filter((directory): directory is string => Boolean(directory));

  const regenerate = async () => {
    try {
      const { changed } = await generateScreens(contextOf(handoff), appPath);
      if (changed) Logger.success('Screens updated.');
    } catch (error) {
      // The dev server keeps the last good files; the next save tries again.
      Logger.error(error instanceof Error ? error.message : String(error));
    }
    arm();
  };

  const schedule = (delay = 50) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void regenerate(), delay);
  };

  const arm = () => {
    void watcher?.close();
    const mainConfig = handoff.getMainConfigFilePath();
    const watched = [...directories(), ...(mainConfig ? [mainConfig] : [])];
    if (watched.length === 0) return;
    watcher = chokidar
      .watch(watched, { ignoreInitial: true, ignored: /(^|[/\\])(node_modules|\..+)([/\\]|$)|\.tmp$/ })
      // The runtime configuration watcher reloads the config first; regenerate once it has.
      .on('all', (_event, file) => schedule(file === mainConfig ? MAIN_CONFIG_SETTLE_MS : 50));
  };

  arm();
};
