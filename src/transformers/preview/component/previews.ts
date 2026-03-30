import type { OptionalPreviewRender } from '../types';

/**
 * Returns previews exposed in docs/API; synthetic pattern previews (`__pattern_*`) are omitted.
 */
export const getDocumentedPreviews = (
  previews?: { [key: string]: OptionalPreviewRender }
): { [key: string]: OptionalPreviewRender } => {
  return Object.fromEntries(
    Object.entries(previews || {}).filter(([key]) => !key.startsWith('__pattern_'))
  );
};
