import { normalizePageDeclaration } from '@handoff/config/normalizers/page';
import { HOME_PAGE_ID, HOME_PAGE_PATH } from '@handoff/registry/content-kinds';
import type { PageDetail } from './records';
// A static import puts the package defaults in every bundle. A deployed registry function cannot
// read the build machine's `config/docs` directory.
import defaultPages from '../../generated/default-pages.json';

/** Registry pages use short-lived ISR so independent instances converge after a publish. */
export const REGISTRY_PAGE_REVALIDATE_SECONDS = 1;

export type BakedDefaultPage = { metadata: Record<string, unknown>; content: string };

/**
 * The packaged default for a page id. Shared by the registry backing and by the registry build,
 * which must resolve the home page without a database connection.
 */
export const defaultPageDetail = (id: string): PageDetail | null => {
  const page = (defaultPages as Record<string, BakedDefaultPage>)[id];
  if (!page) {
    return null;
  }
  const routePath = id === HOME_PAGE_ID ? HOME_PAGE_PATH : `/${id}`;
  return { ...normalizePageDeclaration(page.metadata, { id, routePath }), content: page.content };
};

/** Normalize a page record into the page component's metadata contract. */
export const documentationMetadata = (source: Record<string, unknown>) => {
  const value = (key: string): string => (typeof source[key] === 'string' ? (source[key] as string) : '');
  const title = value('title');
  const description = value('description');
  return {
    title,
    description,
    metaTitle: value('metaTitle') || title,
    metaDescription: value('metaDescription') || description,
  };
};
