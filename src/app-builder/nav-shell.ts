import fs from 'fs-extra';
import matter from 'gray-matter';
import path from 'path';
import Handoff from '..';
import { HOME_PAGE_ID } from '../registry/content-kinds';
import { buildMenuShell } from '../utils/menu-shell';
import { Logger } from '../utils/logger';

/**
 * Relative path (within the staged Next app) of the baked navigation shell. The docs read API
 * (`pages/api/docs/nav.json.ts`) imports this statically so it is bundled into the route chunk and
 * available at runtime without any filesystem read — see `src/utils/menu-shell.ts` for why the
 * markdown-driven shell must be frozen at build time for the Vercel registry function.
 */
export const NAV_SHELL_RELATIVE_PATH = path.join('generated', 'nav-shell.json');

/** Baked package-default markdown used as the registry catch-all's runtime fallback. */
export const DEFAULT_PAGES_RELATIVE_PATH = path.join('generated', 'default-pages.json');

interface BakedDefaultPage {
  metadata: Record<string, unknown>;
  content: string;
}

/** Collect package defaults for registry fallbacks, including the dedicated root home page. */
const collectDefaultPages = (root: string, relativeParts: string[] = []): Record<string, BakedDefaultPage> => {
  if (!fs.existsSync(root)) return {};
  const pages: Record<string, BakedDefaultPage> = {};
  for (const entry of fs.readdirSync(root)) {
    const absolutePath = path.join(root, entry);
    if (fs.lstatSync(absolutePath).isDirectory()) {
      Object.assign(pages, collectDefaultPages(absolutePath, [...relativeParts, entry]));
    } else if (entry.endsWith('.md') && (entry !== `${HOME_PAGE_ID}.md` || relativeParts.length === 0)) {
      const id = [...relativeParts, entry.replace(/\.md$/, '')].join('/');
      const { data, content } = matter(fs.readFileSync(absolutePath, 'utf8'));
      pages[id] = { metadata: data, content };
    }
  }
  return pages;
};

/**
 * Bake package-default docs into the staged app so registry fallback renders do not depend on the
 * build machine's absolute module path. The static JSON import is traced into every deployment.
 */
export const generateDefaultPages = async (handoff: Handoff, appPath: string): Promise<void> => {
  const pages = collectDefaultPages(path.join(handoff.modulePath, 'config', 'docs'));
  const target = path.resolve(appPath, DEFAULT_PAGES_RELATIVE_PATH);
  await fs.ensureDir(path.dirname(target));
  await fs.writeJson(target, pages);
};

/**
 * Bake the markdown-driven navigation shell into the staged app as `generated/nav-shell.json`.
 *
 * Must run BEFORE `next build` so Next inlines the JSON import into the API route chunk. Generated
 * for every build target (workspace dev/start, static export, registry) so the static import never
 * fails to resolve; only registry-mode clients actually fetch and use it.
 */
export const generateNavShell = async (handoff: Handoff, appPath: string, includeWorkspacePages = true): Promise<void> => {
  const docRoot = path.join(handoff.modulePath, 'config', 'docs');
  // A registry serves only what is in its database, so workspace `pages/` present at build time must
  // NOT be frozen into the shell (same rule as components/patterns). Published pages are merged into
  // the shell at request time by `/api/docs/nav.json`; the package's own `config/docs` stays baked.
  const workingPagesDir = includeWorkspacePages ? path.resolve(handoff.workingPath, 'pages') : undefined;
  const basePath = handoff.config?.app?.base_path ?? '';

  const shell = buildMenuShell({ docRoot, workingPagesDir, basePath });

  const target = path.resolve(appPath, NAV_SHELL_RELATIVE_PATH);
  await fs.ensureDir(path.dirname(target));
  await fs.writeJson(target, shell, { spaces: 2 });

  Logger.info(`Baked navigation shell (${shell.length} sections) to ${NAV_SHELL_RELATIVE_PATH}.`);
};
