import fs from 'fs-extra';
import path from 'path';
import type { ComponentListObject, PageListObject, PatternListObject } from '@handoff/transformers/preview/types';
import type { TokenSetKind } from '@handoff/registry/tokens/sets';
import { FilesystemAssetStore } from '@handoff/store/filesystem-assets';
import type { AssetContentResource, AssetMetadata, TokenArtifactResource } from '@handoff/store';
import { getArtifactRoot, resolveArtifactFile } from './artifacts';
import { searchWorkspacePages } from './page-discovery';
import type { PageSearchRequest, PageSearchResult } from './page-search';
import type { SearchResponse } from './search';
import {
  getComponentDetail as getWorkspaceComponentDetail,
  getPageDetail as getWorkspacePageDetail,
  getPatternDetail as getWorkspacePatternDetail,
  getTokenSetDetail as getWorkspaceTokenSetDetail,
  listComponents as listWorkspaceComponents,
  listPages as listWorkspacePages,
  listPatterns as listWorkspacePatterns,
  listTokenSets as listWorkspaceTokenSets,
  type ComponentDetail,
  type PageDetail,
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

/** A minimal token-set listing item (id + kind) for navigation. */
export interface TokenSetListItem {
  id: string;
  kind: TokenSetKind;
}

/** A token set's detail: its extracted record slice + every generated artifact, served byte-for-byte. */
export interface TokenSetDetail {
  id: string;
  kind: TokenSetKind;
  /** `IColorObject[]`/…/`IFileComponentObject` — interpreted by the route per `kind`. */
  record: unknown;
  artifacts: TokenArtifactResource[];
}

/** The data operations every docs read API route is expressed in terms of. */
export interface DocsBackend {
  listComponents(): Promise<ComponentListObject[]>;
  listPatterns(): Promise<PatternListObject[]>;
  /**
   * List published pages. The real consumer is registry-mode navigation; the workspace impl is
   * vestigial (workspace nav is baked at build time and the catch-all reads markdown directly).
   */
  listPages(): Promise<PageListObject[]>;
  getComponentDetail(id: string): Promise<ComponentDetail | null>;
  getPatternDetail(id: string): Promise<PatternDetail | null>;
  /** A page's record + rendered markdown body, or `null` when absent. Read by the catch-all route. */
  getPageDetail(id: string): Promise<PageDetail | null>;
  /**
   * Search the effective page set and return ranked, display-ready results. Project pages replace
   * package defaults. Both backings use the same ranking rules.
   */
  searchPages(request: PageSearchRequest): Promise<SearchResponse<PageSearchResult>>;
  /** Resolve an already-validated logical artifact path, or `null` when it cannot be served. */
  resolveArtifact(segments: string[]): Promise<ResolvedArtifactBody | null>;
  /** List logical token sets (id + kind). The real consumer is registry-mode token navigation. */
  listTokenSets(): Promise<TokenSetListItem[]>;
  /** A token set's record + generated artifacts by stable id, or `null` when absent. */
  getTokenSetDetail(id: string): Promise<TokenSetDetail | null>;
  /** Lightweight metadata for every asset in a collection (never binary bodies). */
  listAssets(collection: string): Promise<AssetMetadata[]>;
  /** One asset's resolved content (bytes or a provider redirect), or `null` when absent. */
  getAssetContent(collection: string, assetPath: string): Promise<AssetContentResource | null>;
}

/**
 * Workspace asset store over the app's mirrored `public/api` tree + copied archives. Registry mode
 * serves assets from the database; this best-effort filesystem view keeps the {@link DocsBackend}
 * contract honest (workspace pages themselves read assets directly, not through this API).
 */
const appPublicRoot = (): string =>
  path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', '.handoff', process.env.HANDOFF_PROJECT_ID ?? '', 'public');

let workspaceAssetStore: FilesystemAssetStore | null = null;
const getWorkspaceAssetStore = (): FilesystemAssetStore => {
  if (!workspaceAssetStore) {
    workspaceAssetStore = new FilesystemAssetStore({
      workingPath: appPublicRoot(),
      getAssetsApiPath: () => getArtifactRoot(),
      getIconsZipFilePath: () => path.join(appPublicRoot(), 'icons.zip'),
      getLogosZipFilePath: () => path.join(appPublicRoot(), 'logos.zip'),
    });
  }
  return workspaceAssetStore;
};

/** Workspace backing: generated filesystem artifacts under the app's mirrored `public/api` root. */
const workspaceBackend: DocsBackend = {
  async listComponents() {
    return listWorkspaceComponents();
  },
  async listPatterns() {
    return listWorkspacePatterns();
  },
  async listPages() {
    return listWorkspacePages();
  },
  async getComponentDetail(id: string) {
    return getWorkspaceComponentDetail(id);
  },
  async getPatternDetail(id: string) {
    return getWorkspacePatternDetail(id);
  },
  async getPageDetail(id: string) {
    return getWorkspacePageDetail(id);
  },
  async searchPages(request: PageSearchRequest) {
    return searchWorkspacePages(request);
  },
  async resolveArtifact(segments: string[]) {
    const resolved = resolveArtifactFile(segments);
    if (!resolved) {
      return null;
    }
    return { contentType: resolved.contentType, body: fs.readFileSync(resolved.absolutePath) };
  },
  async listTokenSets() {
    return listWorkspaceTokenSets();
  },
  async getTokenSetDetail(id: string) {
    return getWorkspaceTokenSetDetail(id);
  },
  async listAssets(collection: string) {
    return getWorkspaceAssetStore().listAssets(collection);
  },
  async getAssetContent(collection: string, assetPath: string) {
    return getWorkspaceAssetStore().getAssetContent(collection, assetPath);
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
