import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureGet, resolveDocsBackend, sendDocsError } from '@/lib/docs-api';
import type { SectionLink } from '@/components/util';
// Build-time-baked navigation shell (section structure + which slots are dynamic). Imported
// statically so it is bundled into this route chunk and readable at runtime in the Vercel registry
// function, where the markdown it is derived from is not traceable. See src/utils/menu-shell.ts.
import navShell from '@/generated/nav-shell.json';

/**
 * `GET /api/docs/nav.json` — everything the nav (side nav + header) needs to render without reading
 * the docs markdown at request time:
 *   - `shell`: the markdown-driven section structure (all top-level sections; component/pattern slots
 *     empty and tagged `dynamic`), baked at build time.
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

  let components: { id: string; title?: string; group?: string; type?: string }[] = [];
  let patterns: { id: string; title?: string; group?: string }[] = [];
  try {
    const backend = await resolveDocsBackend();
    [components, patterns] = await Promise.all([backend.listComponents(), backend.listPatterns()]);
  } catch {
    // Keep the baked shell; entities fill in on the next successful load (e.g. hard refresh).
  }

  try {
    res.status(200).json({
      shell: navShell as unknown as SectionLink[],
      components: components.map(({ id, title, group, type }) => ({ id, title, group, type })),
      patterns: patterns.map(({ id, title, group }) => ({ id, title, group })),
    });
  } catch (error) {
    sendDocsError(res, 'unexpected_error', error instanceof Error ? error.message : 'Unexpected docs read API error.');
  }
}
