import fs from 'fs-extra';
import path from 'path';
import { Types as CoreTypes } from 'handoff-core';
import { normalizePageDeclaration } from '@handoff/config/normalizers/page';
import { HOME_PAGE_ID, HOME_PAGE_PATH } from '@handoff/registry/content-kinds';
import { deriveTokenSets, emptyTokenDocument, setNameForId } from '@handoff/registry/tokens/sets';
import { parseMarkdown } from '@handoff/utils/markdown';
import { collectPageSlugSegments } from '@handoff/utils/pages';
import type { TokenArtifactResource } from '@handoff/store';
import type { ComponentListObject, PageListObject, PatternListObject } from '@handoff/transformers/preview/types';
import type { ArtifactBuildStatus } from '@handoff/artifacts/types';
import { getArtifactRoot } from './artifacts';
import type { TokenSetDetail, TokenSetListItem } from './backend';

/**
 * Workspace-mode metadata reads for the docs read API.
 *
 * List/detail metadata is served from the generated `components.json`/`patterns.json` summaries and
 * the per-entity `component/{id}.json`/`pattern/{id}.json` artifacts — the same files the build
 * produces from the normalized store records. The shapes returned here (`ComponentListObject` /
 * `PatternListObject`) are exactly what the store exposes, so registry mode can serve the
 * same shapes at the same URLs from the database. HTML/asset artifacts are served separately
 * through the canonical artifact route.
 */

/** Detail metadata carries the entity record plus a build state derived from artifact presence. */
export type ComponentDetail = ComponentListObject & { build: { status: ArtifactBuildStatus } };
export type PatternDetail = PatternListObject & { build: { status: ArtifactBuildStatus } };
/** A page's normalized record plus its rendered markdown body. */
export type PageDetail = PageListObject & { content: string };

const readJsonFile = <T>(absolutePath: string): T | null => {
  try {
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return null;
    }
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
  } catch {
    return null;
  }
};

/** Whether the entity's primary detail artifact has been generated. */
const detailArtifactExists = (relativePath: string): boolean => {
  const absolutePath = path.resolve(getArtifactRoot(), relativePath);
  return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
};

/**
 * Build state for an entity in workspace mode. State is derived from artifact presence: `current`
 * when the entity's detail artifact exists, otherwise `missing` (a metadata-only record that is
 * still listable while its preview/asset routes report missing-artifact state).
 */
const deriveBuildStatus = (detailRelativePath: string): ArtifactBuildStatus =>
  detailArtifactExists(detailRelativePath) ? 'current' : 'missing';

export const listComponents = (): ComponentListObject[] =>
  readJsonFile<ComponentListObject[]>(path.resolve(getArtifactRoot(), 'components.json')) ?? [];

export const listPatterns = (): PatternListObject[] =>
  readJsonFile<PatternListObject[]>(path.resolve(getArtifactRoot(), 'patterns.json')) ?? [];

export const getComponentDetail = (id: string): ComponentDetail | null => {
  const record = listComponents().find((component) => component.id === id);
  if (!record) {
    return null;
  }
  return { ...record, build: { status: deriveBuildStatus(path.join('component', `${id}.json`)) } };
};

export const getPatternDetail = (id: string): PatternDetail | null => {
  const record = listPatterns().find((pattern) => pattern.id === id);
  if (!record) {
    return null;
  }
  return { ...record, build: { status: deriveBuildStatus(path.join('pattern', `${id}.json`)) } };
};

/**
 * Workspace-mode page reads, scanned from the filesystem because there is no generated page summary.
 * `getPageDetail` resolves the effective page, so it answers for every route the site serves.
 * `listPages` stays project-only: it feeds the nav resolver, which already gets the package defaults
 * from the baked menu shell.
 */
const workingPagesRoot = (): string => path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages');

/** Effective page roots in precedence order: a project page replaces a package default of the same id. */
export const pageRoots = (): string[] => [path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config', 'docs'), workingPagesRoot()];

/** Collect page slugs, including the root home page but excluding nested section index files. */
const collectPageSlugs = (root: string): string[][] => collectPageSlugSegments(root, { includeRootIndex: true });

/**
 * The markdown file for a page id. The id is matched against the collected slugs rather than joined
 * onto a root, so a request cannot reach outside them.
 */
const resolvePageSource = (id: string): string | null => {
  let sourcePath: string | null = null;
  for (const root of pageRoots()) {
    if (collectPageSlugs(root).some((segments) => segments.join('/') === id)) {
      sourcePath = path.resolve(root, `${id}.md`);
    }
  }
  return sourcePath;
};

export const listPages = (): PageListObject[] => {
  const root = workingPagesRoot();
  return collectPageSlugs(root).map((segments) => {
    const slug = segments.join('/');
    const sourcePath = path.resolve(root, `${slug}.md`);
    const { data } = parseMarkdown(fs.readFileSync(sourcePath, 'utf8'));
    const routePath = slug === HOME_PAGE_ID ? HOME_PAGE_PATH : `/${slug}`;
    return normalizePageDeclaration(data, { id: slug, routePath, sourcePath });
  });
};

export const getPageDetail = (id: string): PageDetail | null => {
  const sourcePath = resolvePageSource(id);
  if (!sourcePath) {
    return null;
  }
  const { data, content } = parseMarkdown(fs.readFileSync(sourcePath, 'utf8'));
  const routePath = id === HOME_PAGE_ID ? HOME_PAGE_PATH : `/${id}`;
  return { ...normalizePageDeclaration(data, { id, routePath, sourcePath }), content };
};

/**
 * Workspace-mode token reads. The generated `tokens.json` and token style files are read straight
 * from the export dir (`HANDOFF_EXPORT_PATH`, else `<cwd>/<HANDOFF_OUTPUT_DIR>`), mirroring the
 * build-time `getTokens`/`fetchTokensString` readers so token behavior is identical to today's. The
 * generated-file layout mirrors `fetchTokensString` (sass/types/sd/css) to preserve current
 * semantics; custom transformer outputs are only surfaced through the registry backing.
 */
const tokensExportRoot = (): string =>
  process.env.HANDOFF_EXPORT_PATH
    ? path.resolve(process.env.HANDOFF_EXPORT_PATH)
    : path.resolve(process.cwd(), process.env.HANDOFF_OUTPUT_DIR ?? 'exported');

const readTokensDocument = (): CoreTypes.IDocumentationObject => {
  const filePath = path.resolve(tokensExportRoot(), 'tokens.json');
  if (!fs.existsSync(filePath)) {
    return emptyTokenDocument();
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as CoreTypes.IDocumentationObject;
  } catch {
    return emptyTokenDocument();
  }
};

const readTokenFile = (relativePath: string): string | null => {
  const absolutePath = path.resolve(tokensExportRoot(), 'tokens', relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null;
  }
  try {
    return fs.readFileSync(absolutePath, 'utf8');
  } catch {
    return null;
  }
};

/** Read the four core generated formats for a set name, mirroring `fetchTokensString`'s layout. */
const readCoreTokenArtifacts = (name: string): TokenArtifactResource[] => {
  const candidates: { path: string; format: string; contentType: string }[] = [
    { path: `sass/${name}.scss`, format: 'scss', contentType: 'text/x-scss; charset=utf-8' },
    { path: `types/${name}.scss`, format: 'types', contentType: 'text/x-scss; charset=utf-8' },
    { path: `css/${name}.css`, format: 'css', contentType: 'text/css; charset=utf-8' },
    { path: `sd/tokens/${name}.tokens.json`, format: 'styleDictionary', contentType: 'application/json; charset=utf-8' },
    { path: `sd/tokens/${name}/${name}.tokens.json`, format: 'styleDictionary', contentType: 'application/json; charset=utf-8' },
  ];
  const artifacts: TokenArtifactResource[] = [];
  const seenFormats = new Set<string>();
  for (const candidate of candidates) {
    if (seenFormats.has(candidate.format)) {
      continue;
    }
    const content = readTokenFile(candidate.path);
    if (content != null) {
      artifacts.push({ path: candidate.path, format: candidate.format, content, contentType: candidate.contentType });
      seenFormats.add(candidate.format);
    }
  }
  return artifacts;
};

export const listTokenSets = (): TokenSetListItem[] => deriveTokenSets(readTokensDocument()).map(({ id, kind }) => ({ id, kind }));

export const getTokenSetDetail = (id: string): TokenSetDetail | null => {
  const set = deriveTokenSets(readTokensDocument()).find((candidate) => candidate.id === id);
  if (!set) {
    return null;
  }
  return { id: set.id, kind: set.kind, record: set.record, artifacts: readCoreTokenArtifacts(setNameForId(id)) };
};
