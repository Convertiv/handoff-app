/**
 * First-class "related source files for an entity" accessor for the workspace store.
 *
 * Gathers an entity's declaration plus every `entries`-referenced source file for checkout and
 * publish. This centralizes that logic so the store, and later transfer, share one definition of
 * "what travels with an entity".
 */

import fs from 'fs-extra';
import path from 'path';
import { resolveComponentDeclaration } from '../config/runtime';
import type { ComponentListObject, PatternListObject } from '../transformers/preview/types';
import { normalizePathForCompare } from '../utils/path';
import type { RegistryTextFileResource, TextFileKind, TextFileResource } from './types';

/** A normalized record carrying a source directory `path` and resolved absolute `entries`. */
type SourcedRecord = (ComponentListObject | PatternListObject) & {
  entries?: Record<string, string | undefined>;
};

/** Maps a component/pattern `entries` key to the source-file kind it contributes. */
const ENTRY_KIND_BY_KEY: Record<string, TextFileKind> = {
  js: 'script',
  scss: 'style',
  component: 'component',
  story: 'story',
  schema: 'schema',
  template: 'template',
  templates: 'template',
};

/** Source-text content types keyed by file extension (lowercase, no dot). */
const SOURCE_CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ts: 'text/typescript; charset=utf-8',
  tsx: 'text/typescript; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  jsx: 'application/javascript; charset=utf-8',
  cjs: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  css: 'text/css; charset=utf-8',
  scss: 'text/x-scss; charset=utf-8',
  sass: 'text/x-sass; charset=utf-8',
  hbs: 'text/x-handlebars-template; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8',
};

export const sourceContentTypeForPath = (filePath: string): string => {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return SOURCE_CONTENT_TYPE_BY_EXT[ext] ?? 'text/plain; charset=utf-8';
};

/**
 * Read a single text source file into a {@link TextFileResource}, or `null` when it is missing or
 * unreadable. `relativeTo` is the entity source directory used to derive the registry-safe path.
 */
const readTextFile = (
  absolutePath: string,
  kind: TextFileKind,
  relativeTo: string
): TextFileResource | null => {
  try {
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return null;
    }
    const content = fs.readFileSync(absolutePath, 'utf8');
    const relative = path.relative(relativeTo, absolutePath).split(path.sep).join('/');
    return {
      path: relative || path.basename(absolutePath),
      absolutePath,
      kind,
      content,
      contentType: sourceContentTypeForPath(absolutePath),
    };
  } catch {
    return null;
  }
};

/** Expand a `templates` directory entry into its contained template files. */
const expandTemplatesDir = (dirPath: string): string[] => {
  try {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return [];
    }
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(dirPath, entry.name));
  } catch {
    return [];
  }
};

/**
 * Locate the entity's declaration file within its source directory and read it as a
 * `kind: 'declaration'` resource. Returns `null` when no declaration can be found/read.
 */
const readDeclarationFile = (sourceDir: string): TextFileResource | null => {
  const declaration = resolveComponentDeclaration(sourceDir, path.basename(sourceDir));
  if (!declaration) return null;
  const absolutePath = path.resolve(sourceDir, declaration.fileName);
  return readTextFile(absolutePath, 'declaration', sourceDir);
};

/**
 * Gather an entity's declaration plus every `entries`-referenced source file. Files are deduped by
 * normalized absolute path (entries duplicate `template`/`component`/`story` after normalization),
 * and a `templates` directory entry is expanded into its files. Declaration always sorts first.
 */
export const getRelatedSourceFilesForRecord = (record: SourcedRecord): TextFileResource[] => {
  const sourceDir = record.path;
  if (!sourceDir) {
    return [];
  }

  const collected: TextFileResource[] = [];
  const seen = new Set<string>();

  const add = (absolutePath: string, kind: TextFileKind) => {
    const key = normalizePathForCompare(absolutePath);
    if (seen.has(key)) return;
    const resource = readTextFile(absolutePath, kind, sourceDir);
    if (!resource) return;
    seen.add(key);
    collected.push(resource);
  };

  const declaration = readDeclarationFile(sourceDir);
  if (declaration) {
    seen.add(normalizePathForCompare(declaration.absolutePath));
    collected.push(declaration);
  }

  const entries = record.entries ?? {};
  for (const [key, value] of Object.entries(entries)) {
    if (!value) continue;
    const kind = ENTRY_KIND_BY_KEY[key] ?? 'other';
    if (key === 'templates') {
      for (const templateFile of expandTemplatesDir(value)) {
        add(templateFile, 'template');
      }
      continue;
    }
    add(value, kind);
  }

  return collected;
};

/** Whether a file resource should be excluded from registry source records (declarations only). */
export const isWorkspaceOnlyFile = (file: TextFileResource): boolean => file.kind === 'declaration';

export const isRegistrySourceFile = (file: TextFileResource): file is RegistryTextFileResource => !isWorkspaceOnlyFile(file);
