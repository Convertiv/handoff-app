import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { ARTIFACTS_ROUTE_SEGMENT } from '../artifacts/url';
import type { ArtifactBuildStatus } from '../artifacts/types';
import type { ComponentListObject, PatternListObject } from '../transformers/preview/types';
import { Logger } from '../utils/logger';
import { getAppPath } from './paths';

/**
 * Static build target materialization (technical design §4/§5/§6, issue #8).
 *
 * Next's `output: 'export'` disables the workspace docs read API (`/api/docs/*`) — the live route
 * handlers cannot serve in an exported site. This module reproduces that read model as route-shaped
 * static files so the exported site consumes the *same* canonical URLs it uses under `next dev`:
 *
 * - `{basePath}/api/docs/artifacts/{path}` — every generated artifact, served by extension.
 * - `{basePath}/api/docs/components.json` / `patterns.json` — the list metadata reads.
 * - `{basePath}/api/docs/components/{id}.json` / `patterns/{id}.json` — the detail metadata reads.
 *
 * Materialized files carry natural extensions so any plain static host serves them with correct
 * content types and no host-specific rewrites. Preview/inspect/asset reads are pure aliases of
 * artifacts the UI loads exclusively through the canonical artifact route, so they are served by the
 * materialized artifact tree rather than duplicated as extensionless files.
 */

/** Detail metadata shape returned by the docs read API (mirrors `lib/docs-api/records`). */
type ComponentDetail = ComponentListObject & { build: { status: ArtifactBuildStatus } };
type PatternDetail = PatternListObject & { build: { status: ArtifactBuildStatus } };

/**
 * Absolute path of the generated artifact root for the running app — the same
 * `.handoff/{projectId}/public/api` directory the docs read API resolves artifacts from.
 */
const getStaticArtifactRoot = (handoff: Handoff): string => path.resolve(getAppPath(handoff), 'public', 'api');

const readJsonArray = <T>(absolutePath: string): T[] => {
  try {
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return [];
    }
    const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

/** Whether the entity's primary detail artifact was generated (drives `current` vs `missing`). */
const detailArtifactExists = (artifactRoot: string, relativePath: string): boolean => {
  const absolutePath = path.resolve(artifactRoot, relativePath);
  return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
};

const deriveBuildStatus = (artifactRoot: string, detailRelativePath: string): ArtifactBuildStatus =>
  detailArtifactExists(artifactRoot, detailRelativePath) ? 'current' : 'missing';

/**
 * Suffix of a component-owned React client/hydration bundle (`<id>.client.js`). Interactive React
 * previews treat this artifact as a *required* reference (technical design §7, issue #6): the
 * preview cannot hydrate without it, so a missing one is a genuine build failure.
 */
const CLIENT_ARTIFACT_SUFFIX = '.client.js';

/**
 * Whether a referenced artifact is *required* — i.e. the referencing HTML cannot render correctly
 * without it. Only the React client bundle qualifies. Component-owned styles/scripts
 * (`<id>.css`/`<id>.js`) and shared/global artifacts (`main.css`/`main.js`/`shared.css`) are
 * optional: the renderers emit `<id>.css`/`<id>.js` optimistically and a component that produces no
 * stylesheet/script simply has none, so an absent optional artifact must not fail the build.
 */
const isRequiredReference = (artifactPath: string): boolean => artifactPath.endsWith(CLIENT_ARTIFACT_SUFFIX);

/**
 * Extract the logical artifact paths a generated HTML document references through the canonical
 * artifact route. References are read from the emitted `href`/`src` URLs (the build's structured
 * references are realized as these tags); this is a build-time integrity check, not the runtime
 * dependency-resolution path.
 */
const extractReferencedArtifactPaths = (html: string): string[] => {
  // Only `href`/`src` attribute values are treated as references, so artifact-shaped strings that
  // happen to appear in embedded preview content are not mistaken for real dependencies.
  const pattern = new RegExp(`(?:href|src)=["'][^"']*?${ARTIFACTS_ROUTE_SEGMENT}/([^"']+)["']`, 'g');
  const paths = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const encoded = match[1].split(/[?#]/)[0];
    const segments = encoded.split('/').filter(Boolean);
    try {
      const decoded = segments.map((segment) => decodeURIComponent(segment));
      if (decoded.length > 0) {
        paths.add(decoded.join('/'));
      }
    } catch {
      // A reference that cannot be decoded is treated as missing below by failing to resolve.
      paths.add(encoded);
    }
  }
  return Array.from(paths);
};

/** Recursively collect every file under a directory as paths relative to it. */
const collectFilesRelative = (root: string): string[] => {
  const results: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile()) {
        results.push(path.relative(root, absolute));
      }
    }
  };
  if (fs.existsSync(root)) {
    walk(root);
  }
  return results;
};

/**
 * Validate that every artifact referenced by generated HTML can be materialized — i.e. the
 * referenced file exists under the artifact root. Required references (e.g. a React preview's
 * `component/<id>.client.js`) are always emitted, so a missing one fails the static build *before*
 * export rather than producing a site with broken previews.
 *
 * @throws When any generated HTML references an artifact that is not present on disk.
 */
export const validateReferencedArtifacts = (handoff: Handoff): void => {
  const artifactRoot = getStaticArtifactRoot(handoff);
  if (!fs.existsSync(artifactRoot)) {
    return;
  }

  const htmlFiles = collectFilesRelative(artifactRoot).filter((relative) => relative.toLowerCase().endsWith('.html'));
  const missing = new Map<string, Set<string>>();

  for (const htmlRelative of htmlFiles) {
    const html = fs.readFileSync(path.resolve(artifactRoot, htmlRelative), 'utf8');
    for (const referenced of extractReferencedArtifactPaths(html)) {
      // Only required references gate the build; absent optional artifacts (component-owned
      // styles/scripts, shared/global artifacts) are tolerated.
      if (!isRequiredReference(referenced)) {
        continue;
      }
      const target = path.resolve(artifactRoot, ...referenced.split('/'));
      const contained = !path.relative(artifactRoot, target).startsWith('..');
      if (!contained || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
        if (!missing.has(referenced)) {
          missing.set(referenced, new Set());
        }
        missing.get(referenced)!.add(htmlRelative);
      }
    }
  }

  if (missing.size > 0) {
    const details = Array.from(missing.entries())
      .map(([artifactPath, referrers]) => `  - ${artifactPath} (referenced by ${Array.from(referrers).join(', ')})`)
      .join('\n');
    throw new Error(
      `Static build aborted: ${missing.size} required artifact(s) referenced by generated HTML could not be materialized:\n${details}`
    );
  }
};

/**
 * Materialize the docs read model into route-shaped static files under `outDir` (the Next export
 * output). Produces the canonical artifact tree plus the list/detail metadata reads, matching the
 * shapes the live docs read API returns so the exported site is byte-for-byte interchangeable with
 * the dev server's responses.
 */
export const materializeDocsReadModel = async (handoff: Handoff, outDir: string): Promise<void> => {
  const artifactRoot = getStaticArtifactRoot(handoff);
  if (!fs.existsSync(artifactRoot)) {
    Logger.warn('No generated artifacts found to materialize for the static build.');
    return;
  }

  const docsRoot = path.join(outDir, 'api', 'docs');
  const artifactsOut = path.join(docsRoot, 'artifacts');

  // Canonical artifact route: every generated artifact, addressable at `/api/docs/artifacts/{path}`.
  await fs.ensureDir(artifactsOut);
  await fs.copy(artifactRoot, artifactsOut, { overwrite: true });

  // List metadata reads.
  const components = readJsonArray<ComponentListObject>(path.resolve(artifactRoot, 'components.json'));
  const patterns = readJsonArray<PatternListObject>(path.resolve(artifactRoot, 'patterns.json'));
  await fs.ensureDir(docsRoot);
  await fs.writeJson(path.join(docsRoot, 'components.json'), components);
  await fs.writeJson(path.join(docsRoot, 'patterns.json'), patterns);

  // Detail metadata reads, each carrying the artifact-derived build state.
  await fs.ensureDir(path.join(docsRoot, 'components'));
  for (const component of components) {
    const detail: ComponentDetail = {
      ...component,
      build: { status: deriveBuildStatus(artifactRoot, path.join('component', `${component.id}.json`)) },
    };
    await fs.writeJson(path.join(docsRoot, 'components', `${component.id}.json`), detail);
  }

  await fs.ensureDir(path.join(docsRoot, 'patterns'));
  for (const pattern of patterns) {
    const detail: PatternDetail = {
      ...pattern,
      build: { status: deriveBuildStatus(artifactRoot, path.join('pattern', `${pattern.id}.json`)) },
    };
    await fs.writeJson(path.join(docsRoot, 'patterns', `${pattern.id}.json`), detail);
  }

  Logger.success(
    `Materialized docs read model (${components.length} component(s), ${patterns.length} pattern(s)) for static export.`
  );
};
