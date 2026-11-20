import fs from 'fs';
import path from 'path';

/**
 * Checks of the `screens` config list, run when the config loads. They need only the file system,
 * so a wrong id or a missing directory fails before any build work starts.
 */

export const SCREEN_ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

/** The files of a screen directory, in lookup order. */
export const SCREEN_ENTRY_FILES = {
  ui: ['index.tsx', 'index.jsx', 'index.ts', 'index.js'],
  collections: ['collections.ts', 'collections.js'],
  tools: ['tools.ts', 'tools.js'],
} as const;

export interface ScreenFiles {
  id: string;
  /** Absolute path of the screen directory. */
  dir: string;
  /** As written in the config, for messages. */
  module: string;
  ui: string;
  collections?: string;
  tools?: string;
}

const firstExisting = (dir: string, names: readonly string[]): string | undefined =>
  names.map((name) => path.join(dir, name)).find((file) => fs.existsSync(file));

/** Find each declared screen's files. Throws with the fix when the declaration or the directory is wrong. */
export const resolveScreenDeclarations = (screens: unknown, workingPath: string): ScreenFiles[] => {
  if (screens === undefined || screens === null) return [];
  if (!Array.isArray(screens)) {
    throw new Error(
      '`screens` must be a list of `{ id, module }` entries, for example `screens: [{ id: "notes", module: "./screens/notes" }]`.'
    );
  }
  const seen = new Map<string, number>();
  return screens.map((entry, index) => {
    const where = `screens[${index}]`;
    if (!entry || typeof entry !== 'object') throw new Error(`${where} must be an object with \`id\` and \`module\`.`);
    const { id, module } = entry as { id?: unknown; module?: unknown };
    if (typeof id !== 'string' || !SCREEN_ID_PATTERN.test(id)) {
      throw new Error(
        `${where}.id ${JSON.stringify(id)} is invalid. Use lowercase letters, digits and "-", starting with a letter (at most 40 characters).`
      );
    }
    if (seen.has(id)) {
      throw new Error(`${where}.id "${id}" is already used by screens[${seen.get(id)}]. Give each screen its own id.`);
    }
    seen.set(id, index);
    if (typeof module !== 'string' || !module.trim()) {
      throw new Error(`${where}.module must be the path of the screen directory, for example "./screens/${id}".`);
    }
    const dir = path.resolve(workingPath, module);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(
        `${where}.module "${module}" is not a directory (resolved to ${dir}). Create it, or run \`handoff-app make:screen ${id}\`.`
      );
    }
    const ui = firstExisting(dir, SCREEN_ENTRY_FILES.ui);
    if (!ui) {
      throw new Error(`Screen "${id}" has no index.tsx in ${dir}. Add one that default-exports defineScreen({ ... }).`);
    }
    return {
      id,
      dir,
      module,
      ui,
      collections: firstExisting(dir, SCREEN_ENTRY_FILES.collections),
      tools: firstExisting(dir, SCREEN_ENTRY_FILES.tools),
    };
  });
};
