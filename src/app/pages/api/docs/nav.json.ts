import type { NextApiRequest, NextApiResponse } from 'next';
import { handleDocsRoute } from '@/lib/docs-api';

/**
 * `GET /api/docs/nav.json` — the minimal data the left nav needs to render the component/pattern
 * submenus (technical design §5): only `id`/`title`/`group` (plus component `type` for type-filtered
 * submenus), so the nav never transfers the full `ComponentListObject`/`PatternListObject` payloads
 * (descriptions, images, entries, …) just to draw links, and resolves both submenus in one request.
 *
 * Mode-aware via the shared docs backend — identical shape in workspace and registry mode.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  return handleDocsRoute(req, res, async (backend) => {
    const [components, patterns] = await Promise.all([backend.listComponents(), backend.listPatterns()]);
    res.status(200).json({
      components: components.map(({ id, title, group, type }) => ({ id, title, group, type })),
      patterns: patterns.map(({ id, title, group }) => ({ id, title, group })),
    });
  });
}
