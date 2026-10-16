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
import type { TransferArtifact } from '../transfer';

const SHARED_ARTIFACT_PATHS = new Set([SHARED_MAIN_CSS_ARTIFACT_PATH, SHARED_MAIN_JS_ARTIFACT_PATH, SHARED_STYLES_CSS_ARTIFACT_PATH]);

const CLIENT_ARTIFACT_SUFFIX = '.client.js';

const ARTIFACT_KIND_BY_EXT: Record<string, ArtifactKind> = {
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.js': 'javascript',
};

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

const artifactKindForPath = (artifactPath: string): ArtifactKind =>
  ARTIFACT_KIND_BY_EXT[path.extname(artifactPath).toLowerCase()] ?? 'other';

const contentTypeForPath = (artifactPath: string): string =>
  CONTENT_TYPE_BY_EXT[path.extname(artifactPath).toLowerCase()] ?? 'text/plain; charset=utf-8';

/** Absolute path of the generated artifact root the build writes to (`<workspace>/public/api`). */
export const getArtifactRoot = (handoff: Handoff): string => path.resolve(handoff.workingPath, 'public', 'api');

export const isSharedArtifactPath = (artifactPath: string): boolean => SHARED_ARTIFACT_PATHS.has(artifactPath);

/**
 * Resolve the owning component id for a file under `public/api/component`, or `null` when it is a
 * shared artifact or owned by no known component. Exact CSS, JavaScript, JSON, and client bundle
 * filenames map directly. HTML filenames use the longest known component id prefix, which prevents
 * a component such as `button group` from being read as `button`.
 */
export const resolveComponentArtifactOwner = (fileName: string, componentIds: Set<string>): string | null => {
  if (isSharedArtifactPath(`component/${fileName}`)) {
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
  if (isSharedArtifactPath(referencedPath)) {
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
export const readArtifact = (
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

/** Add a referenced shared/component artifact to the map when present on disk (deduped by path). */
export const addReferencedArtifact = (root: string, artifactPath: string, byPath: Map<string, TransferArtifact>): void => {
  if (byPath.has(artifactPath)) {
    return;
  }
  const reference = toArtifactReference(artifactPath);
  const ownerKind = reference.ownerKind ?? (isSharedArtifactPath(artifactPath) ? 'asset' : 'component');
  const ownerId = reference.ownerKind === 'asset' ? null : (reference.ownerId ?? null);
  const artifact = readArtifact(root, artifactPath, ownerKind, ownerId);
  if (artifact) {
    byPath.set(artifactPath, artifact);
  }
};
