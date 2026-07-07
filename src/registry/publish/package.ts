/**
 * Publish package assembly for the connected workspace.
 *
 * After a fresh targeted build, this gathers exactly one entity's package from the generated
 * `public/api` artifacts: the normalized record, its registry-safe source files (declarations
 * excluded), and the rendered docs artifacts it needs to render in registry mode — entity-owned
 * artifacts plus the required shared/global artifacts (`component/main.{css,js}`,
 * `component/shared.css`) and, for a pattern, the component artifacts its composed HTML references.
 *
 * Artifact dependencies are read from the generated HTML's canonical `/api/docs/artifacts/{path}`
 * references (the structured references realized as `href`/`src`), never by guessing from filenames.
 * Nothing here uploads — assembly and upload are separate so a failed integrity check stops a
 * publish before any network call.
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import {
  ARTIFACTS_ROUTE_SEGMENT,
  SHARED_MAIN_CSS_ARTIFACT_PATH,
  SHARED_MAIN_JS_ARTIFACT_PATH,
  SHARED_STYLES_CSS_ARTIFACT_PATH,
} from '../../artifacts';
import type { ArtifactKind, ArtifactReference } from '../../artifacts/types';
import Handoff from '../../index';
import { isWorkspaceOnlyFile } from '../../store/source-files';
import type { ComponentListObject, PatternListObject } from '../../transformers/preview/types';
import type { RegistryTextFileKind } from '../db/schema';
import type { TransferArtifact, TransferEntityKind, TransferFile, TransferPackage } from '../transfer';

/** A publish-time failure that should surface to the CLI as a clean, actionable message. */
export class PublishPackageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishPackageError';
  }
}

const SHARED_ARTIFACT_PATHS = new Set([
  SHARED_MAIN_CSS_ARTIFACT_PATH,
  SHARED_MAIN_JS_ARTIFACT_PATH,
  SHARED_STYLES_CSS_ARTIFACT_PATH,
]);

const CLIENT_ARTIFACT_SUFFIX = '.client.js';

/** Absolute path of the generated artifact root the build writes to (`<workspace>/public/api`). */
const getArtifactRoot = (handoff: Handoff): string => path.resolve(handoff.workingPath, 'public', 'api');

const ARTIFACT_KIND_BY_EXT: Record<string, ArtifactKind> = {
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.js': 'javascript',
};

const artifactKindForPath = (artifactPath: string): ArtifactKind => ARTIFACT_KIND_BY_EXT[path.extname(artifactPath).toLowerCase()] ?? 'other';

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

const contentTypeForPath = (artifactPath: string): string =>
  CONTENT_TYPE_BY_EXT[path.extname(artifactPath).toLowerCase()] ?? 'text/plain; charset=utf-8';

/**
 * Resolve the owning component id for a file under `public/api/component`, or `null` when it is a
 * shared/global artifact or owned by no known component. Single-segment `<id>.{css,js,json}` and
 * `<id>.client.js` map by exact id; preview/inspect HTML (`<id>-<preview>.html`) maps by the longest
 * known component id that prefixes the filename (so `button-group-…` is never read as `button`).
 */
const resolveComponentArtifactOwner = (fileName: string, componentIds: Set<string>): string | null => {
  if (SHARED_ARTIFACT_PATHS.has(`component/${fileName}`)) {
    return null;
  }
  if (fileName.endsWith(CLIENT_ARTIFACT_SUFFIX)) {
    const id = fileName.slice(0, -CLIENT_ARTIFACT_SUFFIX.length);
    return componentIds.has(id) ? id : null;
  }
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.css' || ext === '.js' || ext === '.json') {
    const id = fileName.slice(0, -ext.length);
    return componentIds.has(id) ? id : null;
  }
  if (ext === '.html') {
    let longest: string | null = null;
    for (const id of Array.from(componentIds)) {
      if (fileName.startsWith(`${id}-`) && (!longest || id.length > longest.length)) {
        longest = id;
      }
    }
    return longest;
  }
  return null;
};

/** Extract the logical artifact paths an HTML document references through the canonical route. */
const extractReferencedArtifactPaths = (html: string): string[] => {
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
      paths.add(encoded);
    }
  }
  return Array.from(paths);
};

/** Build a structured reference for a referenced artifact path (only the client bundle is required). */
const toArtifactReference = (referencedPath: string): ArtifactReference => {
  if (referencedPath.endsWith(CLIENT_ARTIFACT_SUFFIX)) {
    const ownerId = path.basename(referencedPath).slice(0, -CLIENT_ARTIFACT_SUFFIX.length);
    return { path: referencedPath, kind: 'client', required: true, ownerKind: 'component', ownerId };
  }
  if (SHARED_ARTIFACT_PATHS.has(referencedPath)) {
    return { path: referencedPath, kind: 'shared', required: false, ownerKind: 'asset', ownerId: null };
  }
  const ext = path.extname(referencedPath).toLowerCase();
  if (referencedPath.startsWith('component/') && (ext === '.css' || ext === '.js')) {
    const ownerId = path.basename(referencedPath, ext);
    return { path: referencedPath, kind: ext === '.css' ? 'style' : 'script', required: false, ownerKind: 'component', ownerId };
  }
  return { path: referencedPath, kind: 'other', required: false };
};

/** Read a generated artifact file into a {@link TransferArtifact}, or `null` when it does not exist. */
const readArtifact = (
  root: string,
  artifactPath: string,
  ownerKind: TransferArtifact['ownerKind'],
  ownerId: string | null
): TransferArtifact | null => {
  const absolutePath = path.resolve(root, ...artifactPath.split('/'));
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return null;
  }
  const content = fs.readFileSync(absolutePath, 'utf8');
  const references = artifactPath.endsWith('.html') ? extractReferencedArtifactPaths(content).map(toArtifactReference) : undefined;
  return {
    path: artifactPath,
    artifactKind: artifactKindForPath(artifactPath),
    content,
    contentType: contentTypeForPath(artifactPath),
    ownerKind,
    ownerId,
    references,
    size: Buffer.byteLength(content, 'utf8'),
  };
};

/**
 * Build a registry-safe `item` record: the built summary enriched with the renderer and the entry
 * source-file paths **remapped** from absolute workspace locations to the registry-safe relative
 * paths the uploaded source files use. Workspace-absolute paths never cross to the registry, and a
 * later checkout can reconstruct the entity from the relative entries + uploaded files.
 */
const enrichItem = async (
  handoff: Handoff,
  kind: TransferEntityKind,
  id: string,
  summary: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const runtime =
    kind === 'component' ? await handoff.store.components.get(id) : await handoff.store.patterns.get(id);
  if (!runtime) {
    return summary;
  }

  const sourceDir = (runtime as { path?: string }).path;
  const rawEntries = (runtime as { entries?: Record<string, string | undefined> }).entries;
  const item: Record<string, unknown> = { ...summary };

  const renderer = (runtime as { renderer?: string }).renderer;
  if (renderer) {
    item.renderer = renderer;
  }

  if (rawEntries && sourceDir) {
    const remapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawEntries)) {
      if (!value) {
        continue;
      }
      const relative = path.relative(sourceDir, value).split(path.sep).join('/');
      remapped[key] = relative || path.basename(value);
    }
    if (Object.keys(remapped).length > 0) {
      item.entries = remapped;
    }
  }

  return item;
};

/** Map an entity's related source files to transfer files, dropping workspace-only declarations. */
const collectSourceFiles = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<TransferFile[]> => {
  const store = kind === 'component' ? handoff.store.components : kind === 'pattern' ? handoff.store.patterns : handoff.store.pages;
  const related = await store.getRelatedSourceFiles(id);
  return related
    .filter((file) => !isWorkspaceOnlyFile(file))
    .map((file) => ({ path: file.path, kind: file.kind as RegistryTextFileKind, content: file.content, contentType: file.contentType }));
};

/** Deterministic content hash over the package artifacts (sorted by path) for build provenance. */
const hashArtifacts = (artifacts: TransferArtifact[]): string => {
  const hash = crypto.createHash('sha256');
  for (const artifact of [...artifacts].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(artifact.path);
    hash.update('\0');
    hash.update(artifact.content);
    hash.update('\0');
  }
  return hash.digest('hex');
};

const readSummary = <T>(root: string, fileName: string): T[] => {
  const absolutePath = path.resolve(root, fileName);
  try {
    if (!fs.existsSync(absolutePath)) {
      return [];
    }
    const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

/** Add a referenced shared/component artifact to the map when present on disk (deduped by path). */
const addReferencedArtifact = (
  root: string,
  artifactPath: string,
  byPath: Map<string, TransferArtifact>
): void => {
  if (byPath.has(artifactPath)) {
    return;
  }
  const reference = toArtifactReference(artifactPath);
  const ownerKind = reference.ownerKind ?? (SHARED_ARTIFACT_PATHS.has(artifactPath) ? 'asset' : 'component');
  const ownerId = reference.ownerKind === 'asset' ? null : reference.ownerId ?? null;
  const artifact = readArtifact(root, artifactPath, ownerKind, ownerId);
  if (artifact) {
    byPath.set(artifactPath, artifact);
  }
};

/**
 * Assemble a component's publish package: its detail JSON, preview/inspect HTML, and own css/js/
 * client artifacts, plus the shared/global artifacts referenced by its HTML.
 */
const buildComponentPackage = async (handoff: Handoff, id: string): Promise<TransferPackage> => {
  const root = getArtifactRoot(handoff);
  const componentDir = path.join(root, 'component');

  const componentIds = new Set((await handoff.store.components.list()).map((component) => component.id));
  if (!componentIds.has(id)) {
    throw new PublishPackageError(`Component "${id}" is not declared in this workspace.`);
  }

  const summary = readSummary<ComponentListObject>(root, 'components.json').find((entry) => entry.id === id);
  if (!summary) {
    throw new PublishPackageError(
      `No built record for component "${id}" was found in public/api/components.json after the build.`
    );
  }

  const byPath = new Map<string, TransferArtifact>();
  const entries = fs.existsSync(componentDir) ? fs.readdirSync(componentDir) : [];
  for (const entry of entries) {
    if (resolveComponentArtifactOwner(entry, componentIds) !== id) {
      continue;
    }
    const artifactPath = `component/${entry}`;
    const artifact = readArtifact(root, artifactPath, 'component', id);
    if (artifact) {
      byPath.set(artifactPath, artifact);
    }
  }

  if (byPath.size === 0) {
    throw new PublishPackageError(
      `No generated artifacts were found for component "${id}". Ensure the component builds successfully before publishing.`
    );
  }

  // Pull in the shared/global artifacts the component's HTML actually references (present on disk).
  for (const artifact of Array.from(byPath.values())) {
    for (const reference of artifact.references ?? []) {
      if (SHARED_ARTIFACT_PATHS.has(reference.path)) {
        addReferencedArtifact(root, reference.path, byPath);
      }
    }
  }

  const artifacts = Array.from(byPath.values());
  return {
    item: await enrichItem(handoff, 'component', id, summary as unknown as Record<string, unknown>),
    files: await collectSourceFiles(handoff, 'component', id),
    artifacts,
    build: buildProvenance(artifacts),
  };
};

/**
 * Assemble a pattern's publish package: its composed HTML + record JSON, plus the component and
 * shared/global artifacts its HTML references (a pattern composes markup inline but still depends on
 * the referenced stylesheets/scripts to render).
 */
const buildPatternPackage = async (handoff: Handoff, id: string): Promise<TransferPackage> => {
  const root = getArtifactRoot(handoff);

  const patternIds = new Set((await handoff.store.patterns.list()).map((pattern) => pattern.id));
  if (!patternIds.has(id)) {
    throw new PublishPackageError(`Pattern "${id}" is not declared in this workspace.`);
  }

  const summary = readSummary<PatternListObject>(root, 'patterns.json').find((entry) => entry.id === id);
  if (!summary) {
    throw new PublishPackageError(
      `No built record for pattern "${id}" was found in public/api/patterns.json after the build.`
    );
  }

  const byPath = new Map<string, TransferArtifact>();
  for (const fileName of [`${id}.html`, `${id}.json`]) {
    const artifact = readArtifact(root, `pattern/${fileName}`, 'pattern', id);
    if (artifact) {
      byPath.set(`pattern/${fileName}`, artifact);
    }
  }

  if (!byPath.has(`pattern/${id}.html`)) {
    throw new PublishPackageError(
      `No generated HTML was found for pattern "${id}". Ensure the pattern composes successfully before publishing.`
    );
  }

  // Pull in the component + shared/global artifacts the composed pattern HTML references.
  for (const artifact of Array.from(byPath.values())) {
    for (const reference of artifact.references ?? []) {
      if (reference.path.startsWith('component/')) {
        addReferencedArtifact(root, reference.path, byPath);
      }
    }
  }

  const artifacts = Array.from(byPath.values());
  return {
    item: await enrichItem(handoff, 'pattern', id, summary as unknown as Record<string, unknown>),
    files: await collectSourceFiles(handoff, 'pattern', id),
    artifacts,
    build: buildProvenance(artifacts),
  };
};

/** Build the `current` provenance block for a freshly built package. */
const buildProvenance = (artifacts: TransferArtifact[]): TransferPackage['build'] => ({
  status: 'current',
  builtAt: new Date().toISOString(),
  builderVersion: getBuilderVersion(),
  artifactHash: hashArtifacts(artifacts),
});

/** Deterministic content hash over the package source files (sorted by path) for build provenance. */
const hashFiles = (files: TransferFile[]): string => {
  const hash = crypto.createHash('sha256');
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(file.path);
    hash.update('\0');
    hash.update(file.content);
    hash.update('\0');
  }
  return hash.digest('hex');
};

/**
 * Assemble a page's publish package: the normalized record (frontmatter) plus its single verbatim
 * `.md` source file. Pages have no rendered-artifact pipeline (raw markdown is rendered at runtime),
 * so `artifacts` is always empty and provenance is keyed by a source hash rather than an artifact hash.
 */
const buildPagePackage = async (handoff: Handoff, id: string): Promise<TransferPackage> => {
  const record = await handoff.store.pages.get(id);
  if (!record) {
    throw new PublishPackageError(`Page "${id}" is not declared in this workspace.`);
  }

  const files = await collectSourceFiles(handoff, 'page', id);
  if (files.length === 0) {
    throw new PublishPackageError(`No source markdown was found for page "${id}". Ensure the page's .md file exists before publishing.`);
  }

  // `sourcePath` is a workspace-only absolute path; never persist it to the registry record.
  const { sourcePath: _sourcePath, ...item } = record;

  return {
    item: item as unknown as Record<string, unknown>,
    files,
    artifacts: [],
    build: {
      status: 'current',
      builtAt: new Date().toISOString(),
      builderVersion: getBuilderVersion(),
      sourceHash: hashFiles(files),
    },
  };
};

let cachedBuilderVersion: string | undefined;
/** Resolve the handoff-app package version stamped into build provenance. */
export const getBuilderVersion = (): string => {
  if (cachedBuilderVersion) {
    return cachedBuilderVersion;
  }
  try {
    const pkg = require('../../../package.json');
    cachedBuilderVersion = typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    cachedBuilderVersion = '0.0.0';
  }
  return cachedBuilderVersion;
};

/**
 * Verify every **required** structured reference resolves within the assembled package before
 * upload, so a publish fails locally (no network call) on a missing required artifact.
 */
export const assertRequiredArtifactsPresent = (pkg: TransferPackage): void => {
  const present = new Set(pkg.artifacts.map((artifact) => artifact.path));
  const missing: { artifact: string; reference: string }[] = [];
  for (const artifact of pkg.artifacts) {
    for (const reference of artifact.references ?? []) {
      if (reference.required && !present.has(reference.path)) {
        missing.push({ artifact: artifact.path, reference: reference.path });
      }
    }
  }
  if (missing.length > 0) {
    const detail = missing.map(({ artifact, reference }) => `  - ${reference} (required by ${artifact})`).join('\n');
    throw new PublishPackageError(
      `Publish aborted: ${missing.length} required artifact(s) are missing from the build output:\n${detail}`
    );
  }
};

/** Assemble the publish package for an entity from the generated `public/api` artifacts. */
export const buildPublishPackage = (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<TransferPackage> =>
  kind === 'component' ? buildComponentPackage(handoff, id) : kind === 'pattern' ? buildPatternPackage(handoff, id) : buildPagePackage(handoff, id);
