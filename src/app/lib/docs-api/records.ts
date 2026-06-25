import fs from 'fs-extra';
import path from 'path';
import type { ComponentListObject, PatternListObject } from '@handoff/transformers/preview/types';
import type { ArtifactBuildStatus } from '@handoff/artifacts/types';
import { getArtifactRoot } from './artifacts';

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
