import fs from 'fs';
import path from 'path';

/**
 * Resolves the `screens` config to each screen's files when the config loads. It uses only the
 * file system, so a bad id, a missing directory or an uninstalled package fails before the build.
 *
 * `module` reads like an import: `./`, `../` or an absolute path is a workspace directory. Anything
 * else is an npm package, with an optional subpath for a package with several screens. The rest of
 * the build uses the returned files and never resolves `module` itself.
 */

export const SCREEN_ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

/** The files of a screen directory, in lookup order. */
export const SCREEN_ENTRY_FILES = {
  ui: ['index.tsx', 'index.jsx', 'index.ts', 'index.js'],
  collections: ['collections.ts', 'collections.js'],
  options: ['options.ts', 'options.js'],
  tools: ['tools.ts', 'tools.js'],
} as const;

type OptionalEntry = 'collections' | 'options' | 'tools';
const OPTIONAL_ENTRIES: readonly OptionalEntry[] = ['collections', 'options', 'tools'];

/** The `exports` conditions for screen packages, which ship ES modules. */
const EXPORT_CONDITIONS = new Set(['import', 'default']);

const DECLARATION_KEYS = new Set(['id', 'module', 'options']);

export interface ScreenFiles {
  id: string;
  /** As written in the config, for messages. */
  module: string;
  /** The screen directory or the package root. Tailwind scans it. */
  dir: string;
  /** Unset for a workspace screen. */
  packageName?: string;
  ui: string;
  collections?: string;
  options?: string;
  tools?: string;
  /** The declaration's `options`. The build checks them against `options.ts`. */
  optionValues?: Record<string, unknown>;
}

export const isLocalScreenModule = (module: string): boolean =>
  module === '.' || module === '..' || module.startsWith('./') || module.startsWith('../') || path.isAbsolute(module);

const firstExisting = (dir: string, names: readonly string[]): string | undefined =>
  names.map((name) => path.join(dir, name)).find((file) => fs.existsSync(file));

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/** Options are baked into the app and sent to the browser, so they must be plain JSON. */
const jsonProblem = (value: unknown, where: string): string | null => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? null : `${where} is ${value}, which JSON cannot hold.`;
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const problem = jsonProblem(item, `${where}[${index}]`);
      if (problem) return problem;
    }
    return null;
  }
  if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      const problem = jsonProblem(item, `${where}.${key}`);
      if (problem) return problem;
    }
    return null;
  }
  return `${where} is a ${typeof value === 'object' ? 'class instance' : typeof value}. Options must be plain JSON values: strings, numbers, booleans, null, lists and objects.`;
};

const readLocalDirectory = (dir: string): Omit<ScreenFiles, 'id' | 'module' | 'dir' | 'packageName' | 'optionValues'> | null => {
  const ui = firstExisting(dir, SCREEN_ENTRY_FILES.ui);
  if (!ui) return null;
  const files: Omit<ScreenFiles, 'id' | 'module' | 'dir' | 'packageName' | 'optionValues'> = { ui };
  for (const entry of OPTIONAL_ENTRIES) {
    const file = firstExisting(dir, SCREEN_ENTRY_FILES[entry]);
    if (file) files[entry] = file;
  }
  return files;
};

/** `@scope/name/sub/path` → `{ name: '@scope/name', subpath: './sub/path' }`. */
const parsePackageSpecifier = (specifier: string): { name: string; subpath: string } | null => {
  const parts = specifier.split('/');
  const nameParts = specifier.startsWith('@') ? 2 : 1;
  if (parts.length < nameParts || parts.some((part) => !part || part === '.' || part === '..')) return null;
  const rest = parts.slice(nameParts).join('/');
  return { name: parts.slice(0, nameParts).join('/'), subpath: rest ? `./${rest}` : '.' };
};

/** Node's lookup: `node_modules/<name>` in the working directory and each directory above it. */
const findPackageRoot = (name: string, from: string): string | undefined => {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);
    if (path.dirname(dir) === dir) return undefined;
  }
};

const exportTarget = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const target = exportTarget(item);
      if (target) return target;
    }
    return null;
  }
  if (isPlainObject(value)) {
    for (const [condition, item] of Object.entries(value)) {
      if (!EXPORT_CONDITIONS.has(condition)) continue;
      const target = exportTarget(item);
      if (target) return target;
    }
  }
  return null;
};

/** The file a package exports at `subpath`, by the `exports` rules of Node (exact keys, then `*` patterns). */
const resolveExport = (exportsField: unknown, subpath: string): string | null => {
  const isSubpathMap = isPlainObject(exportsField) && Object.keys(exportsField).some((key) => key.startsWith('.'));
  const map: Record<string, unknown> = isSubpathMap ? (exportsField as Record<string, unknown>) : { '.': exportsField };
  if (subpath in map) return exportTarget(map[subpath]);
  let best: { key: string; prefix: string; suffix: string } | undefined;
  for (const key of Object.keys(map)) {
    const star = key.indexOf('*');
    if (star < 0) continue;
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    if (subpath.length >= key.length && subpath.startsWith(prefix) && subpath.endsWith(suffix)) {
      if (!best || prefix.length > best.prefix.length) best = { key, prefix, suffix };
    }
  }
  if (!best) return null;
  const target = exportTarget(map[best.key]);
  return target ? target.split('*').join(subpath.slice(best.prefix.length, subpath.length - best.suffix.length)) : null;
};

const readPackage = (specifier: string, workingPath: string, where: string): Omit<ScreenFiles, 'id' | 'module' | 'optionValues'> => {
  const parsed = parsePackageSpecifier(specifier);
  if (!parsed) {
    throw new Error(`${where}.module "${specifier}" is neither a path nor a package name. Start a path with "./".`);
  }
  const root = findPackageRoot(parsed.name, workingPath);
  if (!root) {
    if (fs.existsSync(path.resolve(workingPath, specifier))) {
      throw new Error(`${where}.module "${specifier}" reads as a package name. Write "./${specifier}" for a workspace directory.`);
    }
    throw new Error(
      `${where}.module "${specifier}" names the package "${parsed.name}", which is not installed. Run \`npm install ${parsed.name}\`, or start a path with "./".`
    );
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { exports?: unknown };
  const base = { dir: root, packageName: parsed.name };

  // Without `exports`, the package directory (or its subpath) is a screen directory.
  if (manifest.exports === undefined) {
    const dir = path.join(root, parsed.subpath);
    const files = fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? readLocalDirectory(dir) : null;
    if (!files) {
      throw new Error(
        `${where}.module "${specifier}": the package has no \`exports\` and ${dir} holds no index file. Export the screen UI as "${parsed.subpath}".`
      );
    }
    return { ...base, ...files };
  }

  const fileOf = (subpath: string): string | undefined => {
    const target = resolveExport(manifest.exports, subpath);
    if (!target) return undefined;
    const file = path.resolve(root, target);
    if (!target.startsWith('./') || !file.startsWith(root + path.sep)) {
      throw new Error(`${where}.module "${specifier}": the export "${subpath}" points outside the package (${target}).`);
    }
    if (!fs.existsSync(file)) {
      throw new Error(
        `${where}.module "${specifier}": the export "${subpath}" points to ${file}, which does not exist. Build the package.`
      );
    }
    return file;
  };

  const ui = fileOf(parsed.subpath);
  if (!ui) {
    throw new Error(
      `${where}.module "${specifier}": the package "${parsed.name}" exports no "${parsed.subpath}" with an "import" or "default" condition. Export the screen UI there.`
    );
  }
  const files: Omit<ScreenFiles, 'id' | 'module' | 'optionValues'> = { ...base, ui };
  const prefix = parsed.subpath === '.' ? '.' : parsed.subpath;
  for (const entry of OPTIONAL_ENTRIES) {
    const file = fileOf(`${prefix}/${entry}`);
    if (file) files[entry] = file;
  }
  return files;
};

/** Finds each declared screen's files. Throws with the fix when a declaration is wrong. */
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
    if (!isPlainObject(entry)) throw new Error(`${where} must be an object with \`id\` and \`module\`.`);
    const unknownKeys = Object.keys(entry).filter((key) => !DECLARATION_KEYS.has(key));
    if (unknownKeys.length > 0) {
      throw new Error(
        `${where} has unknown ${unknownKeys.length === 1 ? 'key' : 'keys'} ${unknownKeys.map((key) => `"${key}"`).join(', ')}. Use \`id\`, \`module\` and \`options\`.`
      );
    }
    const { id, module, options } = entry as { id?: unknown; module?: unknown; options?: unknown };
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
      throw new Error(`${where}.module must be a path that starts with "./" or a package name, for example "./screens/${id}".`);
    }
    if (options !== undefined) {
      if (!isPlainObject(options)) throw new Error(`${where}.options must be an object.`);
      const problem = jsonProblem(options, `${where}.options`);
      if (problem) throw new Error(problem);
    }
    const optionValues = options === undefined ? undefined : (JSON.parse(JSON.stringify(options)) as Record<string, unknown>);

    if (!isLocalScreenModule(module)) {
      return { id, module, optionValues, ...readPackage(module, workingPath, where) };
    }

    const dir = path.resolve(workingPath, module);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      throw new Error(
        `${where}.module "${module}" is not a directory (resolved to ${dir}). Create it, or run \`handoff-app make:screen ${id}\`.`
      );
    }
    const files = readLocalDirectory(dir);
    if (!files) {
      throw new Error(`Screen "${id}" has no index.tsx in ${dir}. Add one that default-exports defineScreen({ ... }).`);
    }
    return { id, module, dir, optionValues, ...files };
  });
};
