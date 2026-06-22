import type { NextApiResponse } from 'next';

/** Entity kinds whose docs pages are statically generated and can be regenerated on demand. */
type RevalidatableEntityKind = 'component' | 'pattern';

/**
 * Best-effort on-demand revalidation of the statically-generated docs pages affected by a registry
 * mutation (technical design §10/§11).
 *
 * Every registry mutation — publish ingest, allowlisted metadata edit, create, delete — flows
 * through this running server, so the pages those mutations affect are regenerated the instant
 * content changes (Next on-demand ISR) instead of waiting for a rebuild or restart: the entity's
 * detail page (correct `<head>` title, metadata, prev/next) and the system index. The component /
 * pattern nav submenus are resolved at request time on the client, so they are intentionally not
 * revalidated here.
 *
 * Revalidation is best-effort: the mutation has already persisted, so a revalidation failure (e.g. a
 * page that has not been generated yet, or a runtime without ISR) must never fail the request — the
 * page refreshes on its next natural regeneration.
 */
export const revalidateEntityPages = async (
  res: NextApiResponse,
  kind: RevalidatableEntityKind,
  id: string
): Promise<void> => {
  const paths = [`/system/${kind}/${id}`, '/system'];
  for (const path of paths) {
    try {
      await res.revalidate(path);
    } catch {
      // Best-effort: see note above. The entity is persisted regardless of revalidation outcome.
    }
  }
};
