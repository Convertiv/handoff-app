import * as fs from 'fs';
import matter from 'gray-matter';
import { startCase } from 'lodash';
import path from 'path';
import type { NavMenuItem, NavSubSection, SectionLink } from '../nav';

/**
 * Build-time menu *shell* builder.
 *
 * The docs navigation is two things: a SHELL (which sections exist, their order/titles, and which
 * submenu slots are filled at runtime from the registry) and the runtime ENTITY lists
 * (components/patterns/token sets) that the resolver splices into those slots. The shell is
 * markdown-driven and therefore static per build; the entities are mutable at runtime and the
 * resolved tree is served by `/api/docs/nav.json`.
 *
 * On Vercel the registry function cannot read `config/docs` markdown at request time — those reads
 * use absolute build-machine paths (`HANDOFF_MODULE_PATH/...`) that do not exist on the deploy host
 * and that nft cannot trace. So the shell is frozen here at build time (where the markdown is
 * present) into `generated/nav-shell.json`, which the API route imports statically (bundled, path
 * independent). The resolver combines it with runtime-variable records before the client renders it.
 *
 * This module is intentionally dependency-light and PURE (fs + gray-matter, no DB, no React, no
 * `@handoff` aliases) so the compiled build pipeline (`dist/`) can import it — `src/app` is excluded
 * from `tsc` and is not importable from the builder.
 *
 * It emits the canonical section structure with empty entity lists and `dynamic` splice markers.
 * `src/nav/resolver.ts` is the sole place that fills those markers in every runtime mode.
 */

/** Back-compatible shell-builder names reconciled to the canonical navigation contract. */
export type MenuShellSubItem = NavMenuItem;
export type MenuShellSubSection = NavSubSection;
export type MenuShellSection = SectionLink;

export interface BuildMenuShellOptions {
  /** Absolute path to the package docs root (`<modulePath>/config/docs`). */
  docRoot: string;
  /** Absolute path to the working-project page overrides (`<workingPath>/pages`), optional. */
  workingPagesDir?: string;
  /** Resolved app base path (e.g. `"foundations"` → no leading/trailing slash), optional. */
  basePath?: string;
}

/**
 * Paths that have dedicated route files and are therefore excluded from auto-scanned submenus.
 * Single source of truth — the docs app imports this (re-exported there as `knownPaths`).
 */
export const KNOWN_PATHS = [
  'assets',
  'assets/fonts',
  'assets/icons',
  'assets/logos',
  'foundations',
  'foundations/colors',
  'foundations/icons',
  'foundations/effects',
  'foundations/logos',
  'foundations/logo',
  'foundations/typography',
  'system',
  'system/component',
  'system/tokens',
  'system/tokens/foundations',
  'system/tokens/foundations/colors',
  'system/tokens/foundations/effects',
  'system/tokens/foundations/typography',
  'system/tokens/components',
  'system/pattern',
];

/** Normalize the base path to the resolver's `"prefix/"` form (or `""`). */
const normalizeBasePath = (basePath?: string): string => {
  if (!basePath) {
    return '';
  }
  return basePath.replace(/^\/+|\/+$/g, '') + '/';
};

/**
 * The static Tokens submenu (Foundations only). Component token sets are mode-resolved runtime
 * records, so the shell bakes only the deterministic Foundations entries. The resolver appends the
 * component token-set records when it fills the dynamic slot. `basePath` must already be
 * `"prefix/"`-normalized.
 */
export const buildTokensFoundationsMenu = (basePath: string): MenuShellSubItem[] => [
  {
    title: 'Foundations',
    path: `${basePath}system/tokens/foundations`,
    menu: [
      { title: 'Colors', path: `${basePath}system/tokens/foundations/colors` },
      { title: 'Effects', path: `${basePath}system/tokens/foundations/effects` },
      { title: 'Typography', path: `${basePath}system/tokens/foundations/typography` },
    ],
  },
];

/**
 * Recursively build menu entries from .md files in a directory (auto-scan for sections that do not
 * declare a `menu` in frontmatter). Shared with the app — single source of truth for the auto-scan.
 */
export const buildMenuFromDirectory = (dirPath: string, urlPrefix: string): MenuShellSubItem[] => {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath);
  const items: (MenuShellSubItem & { weight?: number })[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (fs.lstatSync(fullPath).isDirectory()) {
      const nestedItems = buildMenuFromDirectory(fullPath, `${urlPrefix}/${entry}`);
      if (nestedItems.length > 0) {
        items.push({ title: startCase(entry), path: `${urlPrefix}/${entry}`, menu: nestedItems });
      }
    } else if (entry.endsWith('.md') && entry !== 'index.md') {
      const slug = entry.replace('.md', '');
      const fullSlugPath = `${urlPrefix}/${slug}`.replace(/^\/+/, '');
      if (KNOWN_PATHS.indexOf(fullSlugPath) >= 0) continue;

      const contents = fs.readFileSync(fullPath, 'utf-8');
      const { data: metadata } = matter(contents);
      if (metadata.enabled === false) continue;

      items.push({
        title: metadata.menuTitle ?? metadata.title ?? startCase(slug),
        path: `/${fullSlugPath}`,
        weight: metadata.weight ?? 0,
      });
    }
  }

  return items.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
};

/**
 * Build the full navigation shell from the docs markdown, with all registry entity slots
 * (components/patterns/token sets) emitted empty and tagged `dynamic` for the resolver to fill.
 *
 * Returns the top-level `MenuShellSection[]` sorted by weight — the same shape the docs app's
 * `SectionLink[]` uses, so it serializes directly into `generated/nav-shell.json`.
 */
export const buildMenuShell = (options: BuildMenuShellOptions): MenuShellSection[] => {
  const { docRoot, workingPagesDir } = options;
  const basePath = normalizeBasePath(options.basePath);

  if (!fs.existsSync(docRoot)) {
    return [];
  }

  const docFiles = fs.readdirSync(docRoot);
  let pageFiles: string[] = [];
  if (workingPagesDir && fs.existsSync(workingPagesDir)) {
    pageFiles = fs.readdirSync(workingPagesDir);
  }
  // De-duplicate; working-project pages win over package docs (same as the app).
  const list = Array.from(new Set([...docFiles, ...pageFiles]));

  const sections: MenuShellSection[] = [];
  for (const fileName of list) {
    const fromPages = pageFiles.includes(fileName);
    const search = fromPages ? path.resolve(workingPagesDir as string, fileName) : path.resolve(docRoot, fileName);

    if (
      fs.lstatSync(search).isDirectory() ||
      search === path.resolve(docRoot, 'index.md') ||
      (workingPagesDir && search === path.resolve(workingPagesDir, 'index.md')) ||
      !fileName.endsWith('md')
    ) {
      continue;
    }

    const contents = fs.readFileSync(search, 'utf-8');
    const { data: metadata } = matter(contents);
    if (metadata.enabled === false) {
      continue;
    }

    const filepath = `/${fileName.replace('.md', '')}`;
    const subSections: MenuShellSubSection[] = [];

    if (metadata.menu) {
      for (const key of Object.keys(metadata.menu)) {
        const sub = metadata.menu[key];
        if (sub.components) {
          // Omit `type` entirely when there is no filter (`undefined` is not JSON-serializable).
          const dynamic =
            typeof sub.components === 'string'
              ? { kind: 'components' as const, type: sub.components }
              : { kind: 'components' as const };
          subSections.push({ title: sub.title, menu: [], dynamic });
        } else if (sub.tokens) {
          // Foundations are baked (deterministic); the resolver appends published component token
          // sets into this slot when it builds the refreshed registry tree.
          subSections.push({ title: 'Tokens', menu: buildTokensFoundationsMenu(basePath), dynamic: { kind: 'token-components' } });
        } else if (sub.patterns) {
          // Always keep the empty patterns slot in the shell for the resolver to fill on refresh.
          subSections.push({ title: sub.title || 'Patterns', menu: [], dynamic: { kind: 'patterns' } });
        } else if (sub.enabled !== false) {
          subSections.push(sub as MenuShellSubSection);
        }
      }
    } else {
      // No frontmatter menu: auto-scan the matching directory (working pages win over docs).
      const dirName = fileName.replace('.md', '');
      const nestedFromDocs = buildMenuFromDirectory(path.resolve(docRoot, dirName), `/${dirName}`);
      const nestedFromPages = workingPagesDir
        ? buildMenuFromDirectory(path.resolve(workingPagesDir, dirName), `/${dirName}`)
        : [];
      const seenPaths = new Set<string>();
      const children: MenuShellSubItem[] = [];
      for (const item of [...nestedFromPages, ...nestedFromDocs]) {
        if (item.path && !seenPaths.has(item.path)) {
          seenPaths.add(item.path);
          children.push(item);
        }
      }
      // Wrap the scanned children under one labeled group (no `path`) so the side nav renders them as
      // links — a flat subsection carrying a `path` but no `menu` renders nothing. This matches the
      // record-backed nesting produced by the resolver so all modes remain structurally identical.
      if (children.length > 0) {
        subSections.push({ title: metadata.menuTitle ?? metadata.title, menu: children });
      }
    }

    let external: string | boolean = false;
    if (
      typeof metadata.external === 'string' &&
      (metadata.external.startsWith('http://') || metadata.external.startsWith('https://') || metadata.external.startsWith('/'))
    ) {
      external = metadata.external;
    }

    sections.push({
      title: metadata.menuTitle ?? metadata.title,
      external,
      weight: metadata.weight ?? 0,
      path: filepath,
      subSections,
    });
  }

  return sections.sort((a, b) => a.weight - b.weight);
};
