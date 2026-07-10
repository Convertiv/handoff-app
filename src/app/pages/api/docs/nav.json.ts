import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, getServerRuntimeConfig, resolveDocsBackend, sendDocsData, sendDocsError } from '@/lib/docs-api';
import { buildPagesMenu, type SectionLink } from '@/components/util';
import { setNameForId } from '@handoff/registry/tokens/sets';
import type { TokenSetListItem } from '@/lib/docs-api/backend';
import type { ComponentListObject, PageListObject, PatternListObject } from '@handoff/transformers/preview/types';
// Build-time-baked navigation shell (section structure + which slots are dynamic). Imported
// statically so it is bundled into this route chunk and readable at runtime in the Vercel registry
// function, where the markdown it is derived from is not traceable. See src/utils/menu-shell.ts.
import navShell from '@/generated/nav-shell.json';

/**
 * `GET /api/docs/nav.json` — everything the nav (side nav + header) needs to render without reading
 * the docs markdown at request time:
 *   - `shell`: the markdown-driven section structure (all top-level sections; component/pattern slots
 *     empty and tagged `dynamic`), baked at build time. In registry mode the published pages — which
 *     are not in the build-time bundle — are merged in as sections (overriding a baked section with
 *     the same path), so workspace-authored pages appear in a registry deployment's nav.
 *   - `components`/`patterns`: the minimal, mode-aware entity lists (only `id`/`title`/`group` plus
 *     component `type`) the client uses to fill the dynamic slots — resolved in one request.
 *
 * Unlike the other `/api/docs/*` routes, this one does NOT go through `handleDocsRoute`: the shell is
 * static and the whole point is that the navigation structure renders even when the backend (e.g. the
 * registry database) is unconfigured or briefly unreachable. So the shell is always returned; the
 * entity lists are resolved best-effort and degrade to empty on failure.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!ensureGet(req, res)) {
    return;
  }

  let components: ComponentListObject[] = [];
  let patterns: PatternListObject[] = [];
  let pages: PageListObject[] = [];
  let tokenSets: TokenSetListItem[] = [];
  try {
    const backend = await resolveDocsBackend();
    [components, patterns, pages, tokenSets] = await Promise.all([
      backend.listComponents(),
      backend.listPatterns(),
      backend.listPages(),
      backend.listTokenSets(),
    ]);
  } catch {
    // Keep the baked shell; entities fill in on the next successful load (e.g. hard refresh).
  }

  // The Tokens › Components nav slot is limited to published component token sets. Reuse the
  // component records for titles/groups so the labels match the component catalog.
  const componentById = new Map(components.map((component) => [component.id, component]));
  const componentTokenSets = tokenSets
    .filter((set) => set.kind === 'component')
    .map((set) => {
      const componentId = setNameForId(set.id);
      const record = componentById.get(componentId);
      return { id: componentId, title: record?.title, group: record?.group };
    });

  // The baked shell already contains workspace pages in workspace/static builds. In a registry
  // deployment the shell is baked from the package's own docs only, so merge the DB-published pages in
  // (a published page section overrides a baked one with the same path — mirrors "pages override docs").
  let shell = navShell as unknown as SectionLink[];
  if (getServerRuntimeConfig().mode === 'registry' && pages.length > 0) {
    const byPath = new Map(shell.map((section) => [section.path, section]));
    for (const section of buildPagesMenu(pages, components, patterns)) {
      byPath.set(section.path, section);
    }
    shell = Array.from(byPath.values()).sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
  }

  try {
    // Never cache: a publish must surface in the nav on the next (hard) reload with no rebuild/redeploy.
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    sendDocsData(res, 200, {
      shell,
      components: components.map(({ id, title, group, type }) => ({ id, title, group, type })),
      patterns: patterns.map(({ id, title, group }) => ({ id, title, group })),
      tokenSets: componentTokenSets,
    });
  } catch (error) {
    console.error('Docs navigation response failed.', error);
    sendDocsError(res, 'unexpected_error', 'Unexpected docs read API error.');
  }
}
