/**
 * Database-backed implementation of the normalized store abstraction (technical design §3, issue #10).
 *
 * Registry mode serves only what was published to it: this store reads normalized component and
 * pattern records — and their checkout/inspection source files — straight from the registry
 * database (issue #9 schema). It is the registry counterpart to {@link FilesystemComponentStore},
 * so the docs read API and other consumers stay storage-agnostic.
 *
 * Two invariants hold here that the filesystem store does not enforce:
 * - Filesystem workspace declarations are never loaded as registry content; declarations are
 *   workspace-only (synthesized on checkout) and the registry text-file tables reject the
 *   `declaration` kind at the schema level, so they can never surface through this store.
 * - Reads never materialize source files or run the build pipeline — every record and file is
 *   returned exactly as it was published.
 */

import { eq } from 'drizzle-orm';
import type { RegistryDatabase } from '../registry/db/client';
import { componentFiles, components, patternFiles, patterns } from '../registry/db/schema';
import type { ComponentListObject, PatternListObject } from '../transformers/preview/types';
import type { ComponentStore, HandoffStore, PatternStore, SourceReference, TextFileResource } from './types';

/** Minimal context needed to back a registry store: a live, typed Drizzle database. */
export interface RegistryStoreContext {
  db: RegistryDatabase;
}

/** A persisted text-file row, as selected from `component_files`/`pattern_files`. */
type RegistryFileRow = {
  path: string;
  kind: TextFileResource['kind'];
  content: string | null;
  contentType: string;
};

/**
 * Map a persisted file row to a {@link TextFileResource}. Rows whose content is stored externally
 * (a future object-storage `storageRef` with no inline `content`) are skipped — there is nothing to
 * return inline for them yet. Registry records have no filesystem location, so `absolutePath` is
 * empty (it is documented as workspace-store-only on the type).
 */
const toTextFileResource = (row: RegistryFileRow): TextFileResource | null => {
  if (row.content == null) {
    return null;
  }
  return {
    path: row.path,
    absolutePath: '',
    kind: row.kind,
    content: row.content,
    contentType: row.contentType,
  };
};

export class RegistryComponentStore implements ComponentStore {
  constructor(private readonly context: RegistryStoreContext) {}

  async list(): Promise<ComponentListObject[]> {
    const rows = await this.context.db.select({ record: components.record }).from(components);
    return rows.map((row) => row.record);
  }

  async get(id: string): Promise<ComponentListObject | null> {
    const rows = await this.context.db
      .select({ record: components.record })
      .from(components)
      .where(eq(components.id, id))
      .limit(1);
    return rows[0]?.record ?? null;
  }

  /**
   * Registry source files are keyed by `(entity, path)`, not by an absolute filesystem path, so the
   * filesystem-shaped {@link SourceReference} has no resolvable target here. Related files are read
   * through {@link getRelatedSourceFiles}.
   */
  async getSource(_ref: SourceReference): Promise<TextFileResource | null> {
    return null;
  }

  async getRelatedSourceFiles(id: string): Promise<TextFileResource[]> {
    const rows = await this.context.db
      .select({
        path: componentFiles.path,
        kind: componentFiles.kind,
        content: componentFiles.content,
        contentType: componentFiles.contentType,
      })
      .from(componentFiles)
      .where(eq(componentFiles.componentId, id));
    return rows.map(toTextFileResource).filter((file): file is TextFileResource => file !== null);
  }
}

export class RegistryPatternStore implements PatternStore {
  constructor(private readonly context: RegistryStoreContext) {}

  async list(): Promise<PatternListObject[]> {
    const rows = await this.context.db.select({ record: patterns.record }).from(patterns);
    return rows.map((row) => row.record);
  }

  async get(id: string): Promise<PatternListObject | null> {
    const rows = await this.context.db
      .select({ record: patterns.record })
      .from(patterns)
      .where(eq(patterns.id, id))
      .limit(1);
    return rows[0]?.record ?? null;
  }

  async getSource(_ref: SourceReference): Promise<TextFileResource | null> {
    return null;
  }

  async getRelatedSourceFiles(id: string): Promise<TextFileResource[]> {
    const rows = await this.context.db
      .select({
        path: patternFiles.path,
        kind: patternFiles.kind,
        content: patternFiles.content,
        contentType: patternFiles.contentType,
      })
      .from(patternFiles)
      .where(eq(patternFiles.patternId, id));
    return rows.map(toTextFileResource).filter((file): file is TextFileResource => file !== null);
  }
}

/** Build the database-backed store pair for a registry database connection. */
export const createRegistryStore = (context: RegistryStoreContext): HandoffStore => ({
  components: new RegistryComponentStore(context),
  patterns: new RegistryPatternStore(context),
});
