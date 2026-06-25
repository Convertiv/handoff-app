import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { Logger } from '../utils/logger';

/**
 * Vercel Build Output API layout (`vercel-deployment` issue #1, static + vercel).
 *
 * `--package vercel` emits the Vercel Build Output API directory (`.vercel/output`) instead of the
 * sites-directory deliverable. This module is the single seam that produces that layout; it is
 * invoked as the final-assembly branch from the build functions and never re-stages or re-runs Next.
 *
 * Hard constraint: `.vercel/output` must live at the **repo root** (`handoff.workingPath`) with that
 * exact name. Vercel ignores any `sitesOutputDirectory`-style override for this packaging.
 */

/** Build Output API config version emitted in `.vercel/output/config.json`. */
const BUILD_OUTPUT_API_VERSION = 3;

/** Absolute path of the `.vercel/output` directory at the repo root. */
export const getVercelOutputPath = (handoff: Handoff): string => path.resolve(handoff.workingPath, '.vercel', 'output');

/**
 * Resolve the app base path exactly as `next.config.mjs`'s `resolveBasePath` does, so the emitted
 * `config.json` reflects the same `basePath` the static export was built with. Empty string means no
 * base path (the Build Output API omits the field rather than carrying an empty value).
 */
const resolveBasePath = (rawBasePath: string | undefined): string => {
  if (!rawBasePath) {
    return '';
  }
  const trimmed = rawBasePath.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
};

/**
 * Lay a materialized static export under `.vercel/output/static/` and write a minimal Build Output
 * API v3 `config.json` carrying the app's `trailingSlash` and resolved `basePath`. Pure CDN files —
 * no functions, no database.
 *
 * @param exportDir Absolute path of the materialized static export (the same content the static
 *   target writes to `out/<projectId>`).
 */
export const writeStaticVercelOutput = async (handoff: Handoff, exportDir: string): Promise<void> => {
  const outputPath = getVercelOutputPath(handoff);
  await fs.remove(outputPath);
  await fs.ensureDir(outputPath);

  // Lay the export under static/ — pure CDN files, served directly by Vercel.
  const staticDir = path.join(outputPath, 'static');
  await fs.copy(exportDir, staticDir, { overwrite: true });

  // The staged Next app sets `trailingSlash: true` (src/app/next.config.mjs); the registry/static
  // exports inherit it. Carry it and the resolved base path so the static deploy serves correct URLs.
  const basePath = resolveBasePath(handoff.config?.app?.base_path);
  const config: { version: number; trailingSlash: boolean; basePath?: string } = {
    version: BUILD_OUTPUT_API_VERSION,
    trailingSlash: true,
  };
  if (basePath) {
    config.basePath = basePath;
  }
  await fs.writeFile(path.join(outputPath, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);

  Logger.success(`Packaged static Vercel Build Output API artifact at ${outputPath} (static/ + config.json).`);
};
