import fs from 'fs-extra';
import type { ComponentListObject, PatternListObject } from '@handoff/transformers/preview/types';
import { resolveArtifactFile } from './artifacts';
import {
  getComponentDetail as getWorkspaceComponentDetail,
  getPatternDetail as getWorkspacePatternDetail,
  listComponents as listWorkspaceComponents,
  listPatterns as listWorkspacePatterns,
  type ComponentDetail,
  type PatternDetail,
} from './records';
import { getServerRuntimeConfig } from './runtime-config';

/**
 * Mode-aware data source for the docs read API.
 *
 * The `/api/docs/*` routes depend only on this interface, so they return the *same stable shapes at
 * the same URLs* regardless of which backing resolves them. Workspace mode reads generated
 * filesystem artifacts; registry mode reads the DB-backed docs read-model artifacts
 * published to the registry. The registry backing is loaded lazily so its Drizzle/Postgres
 * dependencies never enter the workspace/static path.
 */

/** A resolved artifact ready to write to the response: its content type and raw body. */
export interface ResolvedArtifactBody {
  contentType: string;
  body: Buffer | string;
}

/** The data operations every docs read API route is expressed in terms of. */
export interface DocsBackend {
  listComponents(): Promise<ComponentListObject[]>;
  listPatterns(): Promise<PatternListObject[]>;
  getComponentDetail(id: string): Promise<ComponentDetail | null>;
  getPatternDetail(id: string): Promise<PatternDetail | null>;
  /** Resolve an already-validated logical artifact path, or `null` when it cannot be served. */
  resolveArtifact(segments: string[]): Promise<ResolvedArtifactBody | null>;
}

/** Workspace backing: generated filesystem artifacts under the app's mirrored `public/api` root. */
const workspaceBackend: DocsBackend = {
  async listComponents() {
    return listWorkspaceComponents();
  },
  async listPatterns() {
    return listWorkspacePatterns();
  },
  async getComponentDetail(id: string) {
    return getWorkspaceComponentDetail(id);
  },
  async getPatternDetail(id: string) {
    return getWorkspacePatternDetail(id);
  },
  async resolveArtifact(segments: string[]) {
    const resolved = resolveArtifactFile(segments);
    if (!resolved) {
      return null;
    }
    return { contentType: resolved.contentType, body: fs.readFileSync(resolved.absolutePath) };
  },
};

/**
 * Resolve the docs backend for the active runtime mode. Registry mode dynamically imports the
 * DB-backed backing so workspace dev/build never loads the database driver code.
 */
export const resolveDocsBackend = async (): Promise<DocsBackend> => {
  if (getServerRuntimeConfig().mode === 'registry') {
    const { createRegistryDocsBackend } = await import('./registry');
    return createRegistryDocsBackend();
  }
  return workspaceBackend;
};
