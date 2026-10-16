/**
 * Logical asset-collection identity: the pure, dependency-light boundary shared by the store,
 * publish, checkout, server ingestion, and the DB schema.
 *
 * Assets are organized into named **collections**. Unlike token sets (a single JSON slice), each
 * collection is a set of individually addressed files (icons/logos SVGs, the icon sprite + manifest,
 * downloadable ZIP archives, font archives). File discovery + the workspace physical layout live in
 * the filesystem asset store; this module only owns the stable collection vocabulary and the
 * content-type mapping, so it stays free of fs/DB/React dependencies.
 */

/** A named asset collection. */
export type AssetCollection = 'icons' | 'logos' | 'fonts';

/** The supported collections, in deterministic order. */
export const ASSET_COLLECTIONS = ['icons', 'logos', 'fonts'] as const;

/** Whether a string is a supported asset collection. */
export const isAssetCollection = (value: string): value is AssetCollection =>
  (ASSET_COLLECTIONS as readonly string[]).includes(value);

/** File extension of a logical path, lower-cased and including the leading dot (`''` when none). */
const extnameOf = (filePath: string): string => {
  const base = filePath.replace(/\\/g, '/').split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot).toLowerCase() : '';
};

/** Content type for an asset by extension. Binary-first (assets are SVG/PNG/ZIP/font/JSON). */
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.zip': 'application/zip',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
};

/** Resolve the content type to serve/transfer an asset with, keyed by its logical path extension. */
export const assetContentType = (logicalPath: string): string =>
  CONTENT_TYPE_BY_EXT[extnameOf(logicalPath)] ?? 'application/octet-stream';
