/** Registry pages use short-lived ISR so independent instances converge after a publish. */
export const REGISTRY_PAGE_REVALIDATE_SECONDS = 1;

export type BakedDefaultPage = { metadata: Record<string, unknown>; content: string };

/** Normalize registry records and baked frontmatter into the page component's metadata contract. */
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
