import type { TokenArtifactResource } from '@handoff/store';

/**
 * Pick the four UI-known download strings (css/scss/styleDictionary/types) from a token set's
 * generated artifacts, defaulting to empty strings. The full artifact list (including custom
 * transformer outputs) is served alongside; these named strings back the existing `DownloadTokens`
 * component without changing its shape.
 */
export const tokenFormatStrings = (
  artifacts: TokenArtifactResource[]
): { css: string; scss: string; styleDictionary: string; types: string } => {
  const byFormat = (format: string): string => artifacts.find((artifact) => artifact.format === format)?.content ?? '';
  return {
    css: byFormat('css'),
    scss: byFormat('scss'),
    styleDictionary: byFormat('styleDictionary'),
    types: byFormat('types'),
  };
};
