import type { NextApiResponse } from 'next';
import { HOME_PAGE_ID, HOME_PAGE_PATH } from '@handoff/registry/content-kinds';

/** Entity kinds whose docs pages are statically generated and can be regenerated on demand. */
export type RevalidatableEntityKind = 'component' | 'pattern' | 'page';

/**
 * Best-effort on-demand revalidation of the statically-generated docs pages affected by a registry
 * mutation.
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
/** The docs paths one entity change affects. Pages own their route; components/patterns live under `/system`. */
const affectedPaths = (kind: RevalidatableEntityKind, id: string): string[] =>
  kind === 'page' ? [id === HOME_PAGE_ID ? HOME_PAGE_PATH : `/${id}/`] : [`/system/${kind}/${id}/`, '/system/'];

/** Regenerate one path, absorbing any failure. See the best-effort note above. */
const revalidatePath = async (res: NextApiResponse, path: string): Promise<void> => {
  try {
    await res.revalidate(path);
  } catch (error) {
    // Best-effort: see note above. The entity is persisted regardless of revalidation outcome.
    console.warn(`Failed to revalidate registry docs path "${path}".`, error);
  }
};

export const revalidateEntityPages = async (res: NextApiResponse, kind: RevalidatableEntityKind, id: string): Promise<void> => {
  for (const path of affectedPaths(kind, id)) {
    await revalidatePath(res, path);
  }
};

/**
 * Revalidate the pages a batch of mutations affects. Paths are de-duplicated first, so a batch
 * touching many components regenerates the shared `/system/` index once instead of once per item.
 * Same best-effort contract as {@link revalidateEntityPages}.
 */
export const revalidateEntityBatch = async (
  res: NextApiResponse,
  entities: readonly { kind: RevalidatableEntityKind; id: string }[]
): Promise<void> => {
  const paths = new Set(entities.flatMap(({ kind, id }) => affectedPaths(kind, id)));
  for (const path of paths) {
    await revalidatePath(res, path);
  }
};
