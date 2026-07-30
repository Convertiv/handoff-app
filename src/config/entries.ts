/**
 * Registering directory-list entries (`entries.components` / `entries.patterns`) in the handoff
 * config. Both scaffolding new component stubs and checking entities out of a registry need a
 * freshly-written entity to be discoverable by the workspace build, so both have to handle every
 * way a path can be declared:
 *
 * - a collection directory (e.g. `"components"`) whose subdirectories are entities: a new sibling
 *   is auto-discovered at runtime, so nothing needs writing to the config;
 * - an individual entity directory (e.g. `"components/button"`): the entity stays invisible until
 *   its own path is added to the list.
 *
 * {@link isEntryCovered} answers "does this already load?" by reusing the runtime expansion
 * ({@link getComponentsForPath}); {@link writeEntries} appends the paths that don't, across the
 * `.json`, `.ts`, `.js`, and `.cjs` config formats.
 */

import fs from 'fs-extra';
import path from 'path';
import { Config } from '../types/config';
import { arePathsEqual } from '../utils/path';
import { getComponentsForPath } from './runtime';

/** The `entries` keys whose values are declared as a list of directory paths. */
export type EntryKind = 'components' | 'patterns';

/** Minimal handoff shape needed here; avoids importing the full Handoff class (circular dep). */
interface ConfigContext {
  config?: Config;
  workingPath: string;
}

/** Config files in precedence order; the first that exists is the one we mutate. */
const CONFIG_FILES = ['handoff.config.ts', 'handoff.config.js', 'handoff.config.cjs', 'handoff.config.json'] as const;

/** Outcome of {@link writeEntries}: `added` on success, `unsupported` when the config couldn't be edited. */
export interface WriteEntriesResult {
  status: 'added' | 'unsupported';
  /** The config file written (or that would need editing); null only when none exists and creation failed. */
  configPath: string | null;
  /** Workspace-relative POSIX paths written into the config. */
  added: string[];
  /** Workspace-relative POSIX paths the caller must add manually (`status: 'unsupported'`). */
  pending: string[];
}

/** Workspace-relative, POSIX-separated path used as a config entry value. */
const toEntryPath = (handoff: ConfigContext, targetDir: string): string =>
  path.relative(handoff.workingPath, targetDir).split(path.sep).join('/');

/**
 * True when `targetDir` already loads through an existing `entries[kind]` declaration: listed
 * directly, or sitting under a declared collection directory that runtime discovery expands.
 * Reuses the same expansion the runtime uses, so every declaration style is covered.
 */
export const isEntryCovered = (handoff: ConfigContext, kind: EntryKind, targetDir: string): boolean => {
  const configured = handoff.config?.entries?.[kind];
  if (!configured?.length) {
    return false;
  }
  return configured
    .flatMap((entry) => getComponentsForPath(path.resolve(handoff.workingPath, entry)))
    .some((dir) => arePathsEqual(dir, targetDir));
};

/** Format an entry array as source, matching the surrounding indentation of a code config. */
const formatEntryArray = (paths: string[], indent: string): string => {
  if (paths.length === 0) return '[]';
  if (paths.length === 1) return `['${paths[0]}']`;
  return `[\n${paths.map((entry) => `${indent}'${entry}',`).join('\n')}\n${indent.slice(2)}]`;
};

/** Append entry paths to a structured `.json` config (lossless read/modify/write). */
const addToJsonConfig = async (configPath: string, kind: EntryKind, relPaths: string[]): Promise<boolean> => {
  try {
    const config = await fs.readJSON(configPath);
    config.entries = config.entries ?? {};
    const existing: string[] = Array.isArray(config.entries[kind]) ? config.entries[kind] : [];
    const existingSet = new Set(existing);
    for (const relPath of relPaths) {
      if (!existingSet.has(relPath)) existing.push(relPath);
    }
    config.entries[kind] = existing;
    await fs.writeJSON(configPath, config, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
};

/**
 * Best-effort splice of entry paths into an executable `.ts` / `.js` / `.cjs` config. These are
 * modules, not data, so there's no lossless structured write; if a computed or spread `entries`
 * array can't be edited textually, the caller falls back to printing the paths for the user to add.
 */
const addToCodeConfig = async (configPath: string, kind: EntryKind, relPaths: string[]): Promise<boolean> => {
  try {
    let content = await fs.readFile(configPath, 'utf8');
    const arrayBlock = formatEntryArray(relPaths, '      ');

    // 1) An `entries: { ... <kind>: [ ... ] }` array already exists, so merge into it.
    const hasKeyArray = new RegExp(`entries\\s*:\\s*\\{[\\s\\S]*?${kind}\\s*:`).test(content);
    const arrayRegex = new RegExp(`(${kind}\\s*:\\s*\\[)([^\\]]*)(\\])`);
    const match = hasKeyArray ? content.match(arrayRegex) : null;
    if (match) {
      const existing = match[2]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean);
      const existingSet = new Set(existing);
      const toAdd = relPaths.filter((relPath) => !existingSet.has(relPath));
      if (toAdd.length > 0) {
        const indentMatch = content.match(new RegExp(`${kind}\\s*:\\s*\\[\\s*\\n(\\s*)`));
        const indent = indentMatch ? indentMatch[1] : '      ';
        content = content.replace(arrayRegex, `${kind}: ${formatEntryArray([...existing, ...toAdd], indent)}`);
        await fs.writeFile(configPath, content, 'utf8');
      }
      return true;
    }

    // 2) An `entries` object exists but not this key, so add the key.
    if (/entries\s*:\s*\{/.test(content)) {
      content = content.replace(/(entries\s*:\s*\{)/, `$1\n    ${kind}: ${arrayBlock},`);
      await fs.writeFile(configPath, content, 'utf8');
      return true;
    }

    // 3) No `entries` object, so insert one into the exported config object.
    const entriesBlock = `  entries: {\n    ${kind}: ${arrayBlock},\n  },\n`;
    for (const anchor of [/module\.exports\s*=\s*\{/, /export\s+default\s+\{/, /defineConfig\s*\(\s*\{/]) {
      if (anchor.test(content)) {
        content = content.replace(anchor, (matched) => `${matched}\n${entriesBlock}`);
        await fs.writeFile(configPath, content, 'utf8');
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Add `targetDirs` to `entries[kind]` in the workspace config so the build discovers them. Callers
 * should first drop already-loading dirs via {@link isEntryCovered}. Paths are stored workspace-
 * relative; a `.json` config is edited losslessly, a code config best-effort. When no config file
 * exists a minimal `handoff.config.json` is created.
 */
export const writeEntries = async (handoff: ConfigContext, kind: EntryKind, targetDirs: string[]): Promise<WriteEntriesResult> => {
  const relPaths = [...new Set(targetDirs.map((dir) => toEntryPath(handoff, dir)))];
  const configFile = CONFIG_FILES.find((file) => fs.existsSync(path.resolve(handoff.workingPath, file)));
  const configPath = configFile ? path.resolve(handoff.workingPath, configFile) : null;

  if (relPaths.length === 0) {
    return { status: 'added', configPath, added: [], pending: [] };
  }

  if (!configPath) {
    const newConfigPath = path.resolve(handoff.workingPath, 'handoff.config.json');
    try {
      await fs.writeJSON(newConfigPath, { entries: { [kind]: relPaths } }, { spaces: 2 });
      return { status: 'added', configPath: newConfigPath, added: relPaths, pending: [] };
    } catch {
      return { status: 'unsupported', configPath: null, added: [], pending: relPaths };
    }
  }

  const ok = configPath.endsWith('.json')
    ? await addToJsonConfig(configPath, kind, relPaths)
    : await addToCodeConfig(configPath, kind, relPaths);

  return ok
    ? { status: 'added', configPath, added: relPaths, pending: [] }
    : { status: 'unsupported', configPath, added: [], pending: relPaths };
};
