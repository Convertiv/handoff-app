/**
 * Filesystem-backed implementation of the normalized store abstraction.
 *
 * It is a thin read view over the already-resolved `runtimeConfig.entries`, so the records it
 * returns are the same normalized component/pattern records the build consumes today — discovery
 * and normalization (modern `*.handoff.*` + legacy `{dirname}.*`, react/handlebars/csf/plain-object
 * declarations, CSF story discovery, `entries` resolution) all happen upstream in
 * `initRuntimeConfig`. The store adds the source-location and related-source-files accessors
 * without changing how anything is discovered or built.
 */

import fs from 'fs-extra';
import path from 'path';
import { resolveTokenTransformers, tokenArtifactPathsForSet } from '../pipeline/token-transformers';
import { deriveTokenSets, isComponentSet, setNameForId } from '../registry/tokens/sets';
import type { ComponentListObject, PageListObject, PatternListObject } from '../transformers/preview/types';
import type { Config, RuntimeConfig } from '../types/config';
import { getRelatedSourceFilesForRecord, sourceContentTypeForPath } from './source-files';
import type {
  ComponentStore,
  PageStore,
  PatternStore,
  SourceReference,
  TextFileResource,
  TokenArtifactResource,
  TokenSetRecord,
  TokenStore,
} from './types';

/**
 * Minimal context needed to back the filesystem store. A `Handoff` instance satisfies this (it
 * carries `runtimeConfig`/`config` and the token path accessors), so the store stays a thin read
 * view without importing the `Handoff` class.
 */
export interface FilesystemStoreContext {
  runtimeConfig?: RuntimeConfig | null;
  config?: Config | null;
  /** Workspace root (`Handoff.workingPath`), holding `public/` and `fonts/`. */
  workingPath?: string;
  /** Absolute path to the generated `tokens.json` (`Handoff.getTokensFilePath()`). */
  getTokensFilePath?(): string;
  /** Absolute path to the generated tokens output dir (`Handoff.getVariablesFilePath()`). */
  getVariablesFilePath?(): string;
  /** Absolute path to the docs API root `public/api` (`Handoff.getAssetsApiPath()`). */
  getAssetsApiPath?(): string;
  /** Absolute path of `icons.zip` (`Handoff.getIconsZipFilePath()`). */
  getIconsZipFilePath?(): string;
  /** Absolute path of `logos.zip` (`Handoff.getLogosZipFilePath()`). */
  getLogosZipFilePath?(): string;
}

const readSourceByReference = (ref: SourceReference): TextFileResource | null => {
  const { absolutePath } = ref;
  try {
    if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return null;
    }
    return {
      path: absolutePath,
      absolutePath,
      kind: 'other',
      content: fs.readFileSync(absolutePath, 'utf8'),
      contentType: sourceContentTypeForPath(absolutePath),
    };
  } catch {
    return null;
  }
};

export class FilesystemComponentStore implements ComponentStore {
  constructor(private readonly context: FilesystemStoreContext) {}

  private get records(): Record<string, ComponentListObject> {
    return this.context.runtimeConfig?.entries?.components ?? {};
  }

  list(): ComponentListObject[] {
    return Object.values(this.records);
  }

  get(id: string): ComponentListObject | null {
    return this.records[id] ?? null;
  }

  getSource(ref: SourceReference): TextFileResource | null {
    return readSourceByReference(ref);
  }

  getRelatedSourceFiles(id: string): TextFileResource[] {
    const record = this.records[id];
    if (!record) return [];
    return getRelatedSourceFilesForRecord(record);
  }
}

export class FilesystemPatternStore implements PatternStore {
  constructor(private readonly context: FilesystemStoreContext) {}

  private get records(): Record<string, PatternListObject> {
    return this.context.runtimeConfig?.entries?.patterns ?? {};
  }

  list(): PatternListObject[] {
    return Object.values(this.records);
  }

  get(id: string): PatternListObject | null {
    return this.records[id] ?? null;
  }

  getSource(ref: SourceReference): TextFileResource | null {
    return readSourceByReference(ref);
  }

  getRelatedSourceFiles(id: string): TextFileResource[] {
    const record = this.records[id];
    if (!record) return [];
    return getRelatedSourceFilesForRecord(record);
  }
}

/**
 * Read a page's verbatim source `.md` as a registry-safe `markdown` resource. The registry-safe path
 * is `${id}.md` (id may contain slashes for nested pages), which is also where checkout writes it.
 */
const readPageSource = (record: PageListObject): TextFileResource | null => {
  const absolutePath = record.sourcePath;
  try {
    if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      return null;
    }
    return {
      path: `${record.id}.md`,
      absolutePath,
      kind: 'markdown',
      content: fs.readFileSync(absolutePath, 'utf8'),
      contentType: 'text/markdown; charset=utf-8',
    };
  } catch {
    return null;
  }
};

export class FilesystemPageStore implements PageStore {
  constructor(private readonly context: FilesystemStoreContext) {}

  private get records(): Record<string, PageListObject> {
    return this.context.runtimeConfig?.entries?.pages ?? {};
  }

  list(): PageListObject[] {
    return Object.values(this.records);
  }

  get(id: string): PageListObject | null {
    return this.records[id] ?? null;
  }

  getSource(ref: SourceReference): TextFileResource | null {
    return readSourceByReference(ref);
  }

  getRelatedSourceFiles(id: string): TextFileResource[] {
    const record = this.records[id];
    if (!record) return [];
    const resource = readPageSource(record);
    return resource ? [resource] : [];
  }
}

/** Content type for a generated token artifact, keyed by extension. */
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.scss': 'text/x-scss; charset=utf-8',
  '.sass': 'text/x-sass; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

export const tokenArtifactContentType = (artifactPath: string): string =>
  CONTENT_TYPE_BY_EXT[path.extname(artifactPath).toLowerCase()] ?? 'text/plain; charset=utf-8';

/**
 * Filesystem-backed token store. Derives logical sets from the generated `tokens.json` and reads
 * their generated artifacts from the tokens output dir using the shared transformer layout, so the
 * paths it reads are exactly the ones `buildStyles` writes.
 */
export class FilesystemTokenStore implements TokenStore {
  constructor(private readonly context: FilesystemStoreContext) {}

  private readDocument(): ReturnType<typeof deriveTokenSets> {
    const tokensFilePath = this.context.getTokensFilePath?.();
    if (!tokensFilePath || !fs.existsSync(tokensFilePath)) {
      return [];
    }
    try {
      const doc = JSON.parse(fs.readFileSync(tokensFilePath, 'utf8'));
      return deriveTokenSets(doc);
    } catch {
      return [];
    }
  }

  listSets(): TokenSetRecord[] {
    return this.readDocument().map(({ id, kind, record }) => ({ id, kind, record }));
  }

  getSet(id: string): TokenSetRecord | null {
    return this.listSets().find((set) => set.id === id) ?? null;
  }

  getArtifacts(id: string): TokenArtifactResource[] {
    const baseDir = this.context.getVariablesFilePath?.();
    if (!baseDir || !this.getSet(id)) {
      return [];
    }
    const transformers = resolveTokenTransformers(this.context);
    const layouts = tokenArtifactPathsForSet(transformers, setNameForId(id), isComponentSet(id));
    const resources: TokenArtifactResource[] = [];
    for (const layout of layouts) {
      const absolutePath = path.resolve(baseDir, ...layout.path.split('/'));
      if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        continue;
      }
      resources.push({
        path: layout.path,
        format: layout.format,
        content: fs.readFileSync(absolutePath, 'utf8'),
        contentType: tokenArtifactContentType(layout.path),
      });
    }
    return resources;
  }

  getArtifact(id: string, format: string): TokenArtifactResource | null {
    return this.getArtifacts(id).find((artifact) => artifact.format === format) ?? null;
  }
}
