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
import type { ComponentListObject, PageListObject, PatternListObject } from '../transformers/preview/types';
import type { RuntimeConfig } from '../types/config';
import { getRelatedSourceFilesForRecord, sourceContentTypeForPath } from './source-files';
import type { ComponentStore, PageStore, PatternStore, SourceReference, TextFileResource } from './types';

/** Minimal context needed to back the filesystem store. */
export interface FilesystemStoreContext {
  runtimeConfig?: RuntimeConfig | null;
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
