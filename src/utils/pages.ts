import * as fs from 'fs';
import path from 'path';
import { HOME_PAGE_ID } from '../registry/content-kinds';

/**
 * Strip a single trailing `.md` extension.
 *
 * Anchored to the end on purpose: an unanchored `replace('.md', '')` removes the FIRST `.md`
 * substring, so a compound name like `notes.mdx.md` becomes `notesx.md` instead of `notes.mdx`.
 * The route, nav link, and discovered id must all agree, so every subsystem strips the extension
 * through this one function.
 */
export const stripMarkdownExtension = (fileName: string): string => fileName.replace(/\.md$/, '');

export interface CollectPageSlugsOptions {
  /**
   * Keep the root-level `index.md` (the home page entity, id `index`). Nested `index.md` files are
   * always skipped because section indexes are owned by dedicated routes. Defaults to `false`.
   */
  includeRootIndex?: boolean;
}

/** True for a page `.md` file; an `index.md` counts only as the root home page when `includeRootIndex` is set. */
const isCollectablePage = (entry: string, isRoot: boolean, includeRootIndex: boolean): boolean => {
  if (!entry.endsWith('.md')) return false;
  if (entry === `${HOME_PAGE_ID}.md`) return isRoot && includeRootIndex;
  return true;
};

/**
 * Recursively collect page slug segments (path relative to `root`, minus the trailing `.md`) for
 * every markdown page under `root`. Shared by page discovery, the routing catch-all, and the nav
 * shell so all three derive identical ids from the same files.
 */
export const collectPageSlugSegments = (
  root: string,
  options: CollectPageSlugsOptions = {},
  relativeParts: string[] = []
): string[][] => {
  if (!fs.existsSync(root)) return [];
  const includeRootIndex = options.includeRootIndex ?? false;
  const results: string[][] = [];
  for (const entry of fs.readdirSync(root)) {
    const fullPath = path.join(root, entry);
    if (fs.lstatSync(fullPath).isDirectory()) {
      results.push(...collectPageSlugSegments(fullPath, options, [...relativeParts, entry]));
    } else if (isCollectablePage(entry, relativeParts.length === 0, includeRootIndex)) {
      results.push([...relativeParts, stripMarkdownExtension(entry)]);
    }
  }
  return results;
};
