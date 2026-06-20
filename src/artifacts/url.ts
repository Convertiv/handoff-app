/**
 * Centralized, basePath-aware canonical artifact URL builder for handoff-app v2.
 *
 * Every artifact reference emitted in generated HTML and docs read data flows through this one
 * builder, replacing the scattered `${basePath}/api/component/*` string-building of v1. URLs are
 * always of the canonical form:
 *
 *   {basePath}/api/docs/artifacts/{artifactPath}
 *
 * intended for use directly in native `href`/`src` attributes. By contract (technical design §6)
 * these URLs never carry a query string and never depend on artifact-specific data attributes —
 * artifact references come from structured metadata, not the URL or the HTML.
 *
 * This module is pure and runtime-agnostic (no Node or browser globals) so the build and the
 * Next app can both import it.
 */

/** Canonical route prefix all artifact URLs are served under. */
export const ARTIFACTS_ROUTE_SEGMENT = 'api/docs/artifacts';

/**
 * Normalize a configured basePath to either an empty string or a single-leading-slash,
 * no-trailing-slash form. Mirrors the Next app's `resolveBasePath` so builder output composes
 * correctly with the configured Next `basePath`.
 */
export const normalizeBasePath = (basePath?: string | null): string => {
  if (!basePath) {
    return '';
  }
  const trimmed = basePath.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
};

/**
 * Split a logical artifact path into its non-empty segments. Leading/trailing/duplicate slashes
 * are ignored; backslashes are treated as separators so Windows-style inputs normalize too.
 */
const toArtifactSegments = (artifactPath: string): string[] =>
  artifactPath
    .split(/[\\/]+/)
    .filter((segment) => segment.length > 0);

/**
 * Build a canonical artifact URL for a logical artifact path.
 *
 * Each path segment is individually `encodeURIComponent`-encoded (so a slash separating logical
 * segments is preserved while reserved characters within a segment are escaped), and the
 * configured `basePath` is preserved ahead of the canonical route.
 *
 * @param artifactPath Logical artifact path, e.g. `component/badge-primary.html`.
 * @param basePath Optional configured base path; normalized like the Next app's basePath.
 * @returns A canonical `{basePath}/api/docs/artifacts/{encodedPath}` URL.
 * @throws If `artifactPath` has no usable segments.
 */
export const buildArtifactUrl = (artifactPath: string, basePath?: string | null): string => {
  const segments = toArtifactSegments(artifactPath);
  if (segments.length === 0) {
    throw new Error(`Cannot build artifact URL: empty artifact path "${artifactPath}".`);
  }
  const encoded = segments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${normalizeBasePath(basePath)}/${ARTIFACTS_ROUTE_SEGMENT}/${encoded}`;
};
