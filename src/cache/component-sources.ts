import fs from 'fs-extra';
import path from 'path';

/**
 * The source files of each component: its declared files, everything they import, and the files that
 * a renderer reads by other means, such as an Angular `templateUrl`. `start` watches them and `publish`
 * uploads the ones inside the item directory, so neither needs to know the renderer. Paths are absolute.
 *
 * The build cache also lists these files, with their states, but it cannot serve these consumers:
 * - It drops an entry whose build failed, so that the next run builds the component again. This record
 *   keeps the last known list, so `start` still watches the file that broke the build.
 * - Only full cached builds write it. `--force`, `publish <id>`, and the watcher's targeted rebuilds
 *   skip it, and a new cache version discards it.
 * - It imports the build, and the docs app reads this record through the store.
 */
export type ComponentSources = Record<string, string[]>;

export type BuiltComponentSources = {
  id: string;
  files: string[];
  /** False when the build ran only some segments, and so read only some files. */
  complete: boolean;
};

export const getComponentSourcesPath = (workingPath: string): string =>
  path.resolve(workingPath, '.handoff', '.cache', 'component-sources.json');

const isFileList = (value: unknown): value is string[] => Array.isArray(value) && value.every((file) => typeof file === 'string');

/** An empty record when there is none yet or it does not parse. Malformed entries are left out. */
export const readComponentSources = (workingPath: string): ComponentSources => {
  try {
    const data = fs.readJsonSync(getComponentSourcesPath(workingPath));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter((entry): entry is [string, string[]] => isFileList(entry[1])));
  } catch {
    return {};
  }
};

/**
 * Records the sources of the components that a run built. A partial build adds its files to the
 * previous list instead of replacing it, so a file that no build reads any more stays until the next
 * full build of the component. With `knownIds`, components that no longer exist are dropped.
 *
 * The file is written only when it changes, because `start` watches it, and it is written atomically,
 * so a reader never sees a partial file.
 */
export const recordComponentSources = async (workingPath: string, built: BuiltComponentSources[], knownIds?: string[]): Promise<void> => {
  const previous = readComponentSources(workingPath);
  const sources: ComponentSources = { ...previous };
  for (const { id, files, complete } of built) {
    sources[id] = complete ? files : Array.from(new Set([...(previous[id] ?? []), ...files]));
  }
  if (knownIds) {
    const known = new Set(knownIds);
    for (const id of Object.keys(sources)) {
      if (!known.has(id)) delete sources[id];
    }
  }

  const file = getComponentSourcesPath(workingPath);
  const content = JSON.stringify(sources, null, 2);
  if (fs.existsSync(file) && JSON.stringify(previous, null, 2) === content) return;

  // A per-process name, because `publish` can build while `start` runs.
  const tempFile = `${file}.${process.pid}.tmp`;
  await fs.ensureDir(path.dirname(file));
  await fs.writeFile(tempFile, content);
  await fs.rename(tempFile, file);
};
