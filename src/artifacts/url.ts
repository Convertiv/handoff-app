/**
 * Centralized, basePath-aware canonical artifact URL builder.
 *
 * Every artifact reference emitted in generated HTML and docs read data flows through this one
 * builder. URLs are always of the canonical form:
 *
 *   {basePath}/api/docs/artifacts/{artifactPath}
 *
 * intended for use directly in native `href`/`src` attributes. By contract these URLs never carry
 * a query string and never depend on artifact-specific data attributes — artifact references come
 * from structured metadata, not the URL or the HTML.
 *
 * This module is pure and runtime-agnostic (no Node or browser globals) so the build and the
 * Next app can both import it.
 */

/** Canonical route prefix all artifact URLs are served under. */
export const ARTIFACTS_ROUTE_SEGMENT = 'api/docs/artifacts';

/** Route prefix for docs read API metadata (`.json`) reads. */
export const DOCS_ROUTE_SEGMENT = 'api/docs';

/** Canonical route prefix all asset content URLs are served under (mode-independent). */
export const ASSETS_ROUTE_SEGMENT = 'api/docs/assets';

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
 * Whether a logical path segment is a relative-traversal marker (`.` or `..`). These survive
 * `encodeURIComponent` (dots are unreserved) and so must be rejected explicitly to keep emitted
 * URLs canonical and contained — mirrors the server resolver's segment validation as defense in
 * depth.
 */
const isTraversalSegment = (segment: string): boolean => segment === '.' || segment === '..';

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
 * @throws If `artifactPath` has no usable segments, or contains a `.`/`..` traversal segment.
 */
export const buildArtifactUrl = (artifactPath: string, basePath?: string | null): string => {
  const segments = toArtifactSegments(artifactPath);
  if (segments.length === 0) {
    throw new Error(`Cannot build artifact URL: empty artifact path "${artifactPath}".`);
  }
  if (segments.some(isTraversalSegment)) {
    throw new Error(`Cannot build artifact URL: path traversal is not allowed in "${artifactPath}".`);
  }
  const encoded = segments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${normalizeBasePath(basePath)}/${ARTIFACTS_ROUTE_SEGMENT}/${encoded}`;
};

/**
 * Build the canonical docs read API URL for a component's detail metadata
 * (`{basePath}/api/docs/components/{id}.json`). The id is URL-encoded; `basePath` is preserved.
 * This is the single source of the metadata-read URL that the build records as an entity's `path`.
 */
export const buildComponentDetailUrl = (id: string, basePath?: string | null): string =>
  `${normalizeBasePath(basePath)}/${DOCS_ROUTE_SEGMENT}/components/${encodeURIComponent(id)}.json`;

/**
 * Build the canonical docs read API URL for a pattern's detail metadata
 * (`{basePath}/api/docs/patterns/{id}.json`). The id is URL-encoded; `basePath` is preserved.
 */
export const buildPatternDetailUrl = (id: string, basePath?: string | null): string =>
  `${normalizeBasePath(basePath)}/${DOCS_ROUTE_SEGMENT}/patterns/${encodeURIComponent(id)}.json`;

/**
 * Build the canonical, basePath-aware content URL for one asset within a collection
 * (`{basePath}/api/docs/assets/{collection}/{logicalPath}`). This is the same route the docs read API
 * serves in every runtime mode: from the database in registry mode, and from statically materialized
 * files in a static export. Each segment is individually encoded and traversal segments are rejected,
 * mirroring {@link buildArtifactUrl}.
 *
 * @throws If the collection or logical path has no usable segments, or contains a `.`/`..` segment.
 */
export const buildAssetUrl = (collection: string, logicalPath: string, basePath?: string | null): string => {
  const segments = [...toArtifactSegments(collection), ...toArtifactSegments(logicalPath)];
  if (segments.length < 2) {
    throw new Error(`Cannot build asset URL: empty collection ("${collection}") or path ("${logicalPath}").`);
  }
  if (segments.some(isTraversalSegment)) {
    throw new Error(`Cannot build asset URL: path traversal is not allowed in "${collection}/${logicalPath}".`);
  }
  const encoded = segments.map((segment) => encodeURIComponent(segment)).join('/');
  return `${normalizeBasePath(basePath)}/${ASSETS_ROUTE_SEGMENT}/${encoded}`;
};

/**
 * Build the canonical download URL for a collection's whole-collection zip bundle
 * (`{basePath}/api/docs/assets/{collection}/{collection}.zip`) — the default target for the docs
 * "Download" links, overridable via `assets_zip_links`.
 */
export const buildAssetDownloadUrl = (collection: string, basePath?: string | null): string =>
  buildAssetUrl(collection, `${collection}.zip`, basePath);
