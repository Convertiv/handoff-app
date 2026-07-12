import type { NextApiRequest, NextApiResponse } from 'next';
import { getRegistryNavData, type NavTokenSet, type SectionLink } from '@handoff/nav';
import { setNameForId } from '@handoff/registry/tokens/sets';
import { ensureGet, resolveDocsBackend, sendDocsData, sendDocsError } from '@/lib/docs-api';
// Kept static so the baked structure is traced into every registry serverless bundle.
import navShell from '@/generated/nav-shell.json';

/** Thin registry refresh adapter. The adapter/resolver owns all navigation structure and filling. */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!ensureGet(req, res)) return;

  try {
    const nav = await getRegistryNavData({
      shell: navShell as unknown as SectionLink[],
      load: 'refresh',
      basePath: process.env.HANDOFF_APP_BASE_PATH,
      fetchRecords: async () => {
        const backend = await resolveDocsBackend();
        const safe = async <T>(read: () => Promise<T[]>): Promise<T[]> => {
          try {
            return (await read()) ?? [];
          } catch {
            return [];
          }
        };
        const [components, patterns, pages, tokenSets] = await Promise.all([
          safe(() => backend.listComponents()),
          safe(() => backend.listPatterns()),
          safe(() => backend.listPages()),
          safe(() => backend.listTokenSets()),
        ]);
        return {
          components,
          patterns,
          pages,
          tokenSets: tokenSets
            .filter((set) => set.kind === 'component')
            .map((set) => ({ id: setNameForId(set.id), kind: 'component' })) as NavTokenSet[],
        };
      },
    });
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    sendDocsData(res, 200, nav);
  } catch (error) {
    console.error('Docs navigation response failed.', error);
    sendDocsError(res, 'unexpected_error', 'Unexpected docs read API error.');
  }
}
