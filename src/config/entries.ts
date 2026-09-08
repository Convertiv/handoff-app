/**
 * Registering catalog directories in the handoff config. Both scaffolding new item stubs and
 * checking entities out of a registry need a freshly-written entity to be discoverable by the
 * workspace build, so both have to handle every way a path can be declared:
 *
 * - a collection directory (e.g. `"components"`) whose subdirectories are entities: a new sibling
 *   is auto-discovered at runtime, so nothing needs writing to the config;
 * - an individual entity directory (e.g. `"components/button"`): the entity stays invisible until
 *   its own path is added to the list.
 *
 * A workspace registers items under `catalog.include`. Discovery expands collection directories;
 * the writer appends uncovered paths in JSON, TypeScript, JavaScript, and CommonJS project configs.
 */

import fs from 'fs-extra';
import path from 'path';
import { Config } from '../types/config';
import { arePathsEqual } from '../utils/path';
import { getComponentsForPath } from './runtime';

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

const registeredPaths = (handoff: ConfigContext): string[] => handoff.config?.catalog?.include ?? [];

/**
 * True when `targetDir` already loads through an existing declaration: listed directly, or sitting
 * under a declared collection directory that runtime discovery expands. Reuses the same expansion
 * the runtime uses, so every declaration style is covered.
 */
export const isEntryCovered = (handoff: ConfigContext, targetDir: string): boolean => {
  const configured = registeredPaths(handoff);
  if (!configured.length) {
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
const addToJsonConfig = async (configPath: string, relPaths: string[]): Promise<boolean> => {
  try {
    const config = await fs.readJSON(configPath);
    config.catalog = config.catalog ?? {};
    const parent = config.catalog;
    const existing: string[] = Array.isArray(parent.include) ? parent.include : [];
    const existingSet = new Set(existing);
    for (const relPath of relPaths) {
      if (!existingSet.has(relPath)) existing.push(relPath);
    }
    parent.include = existing;
    await fs.writeJSON(configPath, config, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
};

/**
 * Blanks out comment regions while keeping every index in place, so a match found here points at
 * the same offset in the original source. The shipped config templates carry commented-out
 * `entries` and `catalog` examples, and a plain search would rewrite the comment instead of the code.
 */
const maskComments = (content: string): string =>
  content
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => ' '.repeat(comment.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (comment, prefix: string) => prefix + ' '.repeat(comment.length - prefix.length));

/** Index of the brace closing the one at `openIndex`, or -1. */
const findMatchingBrace = (source: string, openIndex: number): number => {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

type ListLocation = {
  /** Index of the `{` opening the parent object. */
  parentBrace: number;
  /** Index of the `[` opening the list, when the key already exists. */
  listStart?: number;
  /** Index of the `]` closing the list. */
  listEnd?: number;
};

/** Locates `parent: { key: [ ... ] }` in a code config, ignoring commented-out examples. */
const locateList = (masked: string): ListLocation | undefined => {
  const parentMatch = new RegExp(`(^|[\\s{,;])catalog\\s*:\\s*\\{`, 'm').exec(masked);
  if (!parentMatch) return undefined;

  const parentBrace = masked.indexOf('{', parentMatch.index + parentMatch[0].length - 1);
  const parentClose = findMatchingBrace(masked, parentBrace);
  if (parentClose < 0) return { parentBrace };

  const block = masked.slice(parentBrace, parentClose + 1);
  const keyMatch = new RegExp(`(^|[\\s{,])include\\s*:\\s*\\[`).exec(block);
  if (!keyMatch) return { parentBrace };

  const listStart = parentBrace + block.indexOf('[', keyMatch.index);
  const listEnd = masked.indexOf(']', listStart);
  if (listEnd < 0) return { parentBrace };

  return { parentBrace, listStart, listEnd };
};

/**
 * Best-effort splice of entry paths into an executable `.ts` / `.js` / `.cjs` config. These are
 * modules, not data, so there's no lossless structured write; if a computed or spread list can't be
 * edited textually, the caller falls back to printing the paths for the user to add.
 */
const addToCodeConfig = async (configPath: string, relPaths: string[]): Promise<boolean> => {
  try {
    const content = await fs.readFile(configPath, 'utf8');
    const masked = maskComments(content);
    const arrayBlock = formatEntryArray(relPaths, '      ');
    const location = locateList(masked);

    // 1) The list already exists, so merge into it.
    if (location?.listStart !== undefined && location.listEnd !== undefined) {
      const existing = content
        .slice(location.listStart + 1, location.listEnd)
        .split(',')
        .map((entry) => entry.trim().replace(/['"]/g, ''))
        .filter(Boolean);
      const existingSet = new Set(existing);
      const toAdd = relPaths.filter((relPath) => !existingSet.has(relPath));

      if (toAdd.length > 0) {
        const indentMatch = /\[\s*\n(\s*)/.exec(content.slice(location.listStart));
        const indent = indentMatch ? indentMatch[1] : '      ';
        const merged = formatEntryArray([...existing, ...toAdd], indent);
        await fs.writeFile(configPath, content.slice(0, location.listStart) + merged + content.slice(location.listEnd + 1), 'utf8');
      }
      return true;
    }

    // 2) The parent object exists but not this key, so add the key.
    if (location) {
      const insertAt = location.parentBrace + 1;
      await fs.writeFile(configPath, `${content.slice(0, insertAt)}\n    include: ${arrayBlock},${content.slice(insertAt)}`, 'utf8');
      return true;
    }

    // 3) No parent object, so insert one into the exported config object.
    const parentBlock = `  catalog: {\n    include: ${arrayBlock},\n  },\n`;
    for (const anchor of [/module\.exports\s*=\s*\{/, /export\s+default\s+\{/, /defineConfig\s*\(\s*\{/]) {
      const anchorMatch = anchor.exec(masked);
      if (anchorMatch) {
        const insertAt = anchorMatch.index + anchorMatch[0].length;
        await fs.writeFile(configPath, `${content.slice(0, insertAt)}\n${parentBlock}${content.slice(insertAt)}`, 'utf8');
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Add `targetDirs` to the config so the build discovers them. Callers should first drop
 * already-loading dirs via {@link isEntryCovered}. Paths are stored workspace-relative; a `.json`
 * config is edited losslessly, a code config best-effort. When no config file exists a minimal
 * `handoff.config.json` is created.
 */
export const writeEntries = async (handoff: ConfigContext, targetDirs: string[]): Promise<WriteEntriesResult> => {
  const relPaths = [...new Set(targetDirs.map((dir) => toEntryPath(handoff, dir)))];
  const configFile = CONFIG_FILES.find((file) => fs.existsSync(path.resolve(handoff.workingPath, file)));
  const configPath = configFile ? path.resolve(handoff.workingPath, configFile) : null;

  if (relPaths.length === 0) {
    return { status: 'added', configPath, added: [], pending: [] };
  }

  if (!configPath) {
    const newConfigPath = path.resolve(handoff.workingPath, 'handoff.config.json');
    try {
      await fs.writeJSON(newConfigPath, { catalog: { include: relPaths } }, { spaces: 2 });
      return { status: 'added', configPath: newConfigPath, added: relPaths, pending: [] };
    } catch {
      return { status: 'unsupported', configPath: null, added: [], pending: relPaths };
    }
  }

  const ok = configPath.endsWith('.json')
    ? await addToJsonConfig(configPath, relPaths)
    : await addToCodeConfig(configPath, relPaths);

  return ok
    ? { status: 'added', configPath, added: relPaths, pending: [] }
    : { status: 'unsupported', configPath, added: [], pending: relPaths };
};
