/**
 * Database-backed implementation of the normalized store abstraction.
 *
 * Registry mode serves only what was published to it: this store reads normalized component and
 * pattern records — and their checkout/inspection source files — straight from the registry
 * database. It is the registry counterpart to {@link FilesystemComponentStore},
 * so the docs read API and other consumers stay storage-agnostic.
 *
 * Two invariants hold here that the filesystem store does not enforce:
 * - Filesystem workspace declarations are never loaded as registry content; declarations are
 *   workspace-only (synthesized on checkout) and the registry text-file tables reject the
 *   `declaration` kind at the schema level, so they can never surface through this store.
 * - Reads never materialize source files or run the build pipeline — every record and file is
 *   returned exactly as it was published.
 */

import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type { AssetStorage, AssetStorageReadResult } from '../registry/asset-storage/types';
import type { RegistryDatabase } from '../registry/db/client';
import {
  assetBlobs,
  assetCollections,
  assets,
  componentFiles,
  components,
  pageFiles,
  pages,
  patternFiles,
  patterns,
  tokenArtifacts,
  tokenSets,
  type AssetStorageProvider,
} from '../registry/db/schema';
import type { TokenSetKind } from '../registry/tokens/sets';
import type { ComponentListObject, PageListObject, PatternListObject } from '../transformers/preview/types';
import type {
  AssetContentResource,
  AssetMetadata,
  AssetStore,
  ComponentStore,
  HandoffStore,
  PageStore,
  PatternStore,
  SourceReference,
  TextFileResource,
  TokenArtifactResource,
  TokenSetRecord,
  TokenStore,
} from './types';

/** Minimal context needed to back a registry store: a live, typed Drizzle database. */
export interface RegistryStoreContext {
  db: RegistryDatabase;
  /**
   * Resolve the {@link AssetStorage} adapter for a blob's recorded provider (or `null` for the inline
   * `database` provider). Injected by the app runtime so `src/store` stays free of app-side imports;
   * when omitted, only inline DB-backed asset content is resolvable.
   */
  resolveAssetAdapter?: (provider: AssetStorageProvider) => Promise<AssetStorage | null>;
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
    const rows = await this.context.db.select({ record: components.record }).from(components).where(eq(components.id, id)).limit(1);
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
    const rows = await this.context.db.select({ record: patterns.record }).from(patterns).where(eq(patterns.id, id)).limit(1);
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

export class RegistryPageStore implements PageStore {
  constructor(private readonly context: RegistryStoreContext) {}

  async list(): Promise<PageListObject[]> {
    const rows = await this.context.db.select({ record: pages.record }).from(pages);
    return rows.map((row) => row.record);
  }

  async get(id: string): Promise<PageListObject | null> {
    const rows = await this.context.db.select({ record: pages.record }).from(pages).where(eq(pages.id, id)).limit(1);
    return rows[0]?.record ?? null;
  }

  async getSource(_ref: SourceReference): Promise<TextFileResource | null> {
    return null;
  }

  async getRelatedSourceFiles(id: string): Promise<TextFileResource[]> {
    const rows = await this.context.db
      .select({
        path: pageFiles.path,
        kind: pageFiles.kind,
        content: pageFiles.content,
        contentType: pageFiles.contentType,
      })
      .from(pageFiles)
      .where(eq(pageFiles.pageId, id));
    return rows.map(toTextFileResource).filter((file): file is TextFileResource => file !== null);
  }
}

/** The page fields that search reads. The Markdown includes frontmatter. */
export interface PageSearchCandidate {
  record: PageListObject;
  markdown: string | null;
}

export interface PageSearchCandidateQuery {
  /** Normalized terms. A page is a candidate when any term occurs in any searchable column. */
  terms: string[];
  /** Optional group filter, matched case-insensitively. */
  group?: string;
  /** Maximum rows returned to the server for one search. */
  limit: number;
}

/** Escape the wildcards Postgres reads in an `ILIKE` pattern, so a term cannot widen its own match. */
const likePattern = (term: string): string => `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/**
 * Candidate pages for a search, filtered and capped in SQL.
 *
 * `enabled` and `menuTitle` are fields in the `record` JSON, so the query uses JSON operators. An
 * absent `enabled` field means enabled. ID order makes both runtime modes apply the candidate cap to
 * the same pages. The body includes frontmatter, so this filter can include a false match. Ranking
 * uses the body without frontmatter and removes that match.
 */
export const searchPageCandidates = async (db: RegistryDatabase, query: PageSearchCandidateQuery): Promise<PageSearchCandidate[]> => {
  const matchesTerm = (term: string) => {
    const pattern = likePattern(term);
    return or(
      ilike(pages.title, pattern),
      ilike(pages.description, pattern),
      sql`${pages.record}->>'menuTitle' ilike ${pattern}`,
      ilike(pageFiles.content, pattern)
    );
  };

  return db
    .select({ record: pages.record, markdown: pageFiles.content })
    .from(pages)
    .leftJoin(pageFiles, and(eq(pageFiles.pageId, pages.id), eq(pageFiles.kind, 'markdown')))
    .where(
      and(
        sql`${pages.record}->>'enabled' is distinct from 'false'`,
        query.group ? sql`lower(${pages.group}) = lower(${query.group})` : undefined,
        or(...query.terms.map(matchesTerm))
      )
    )
    .orderBy(pages.id)
    .limit(query.limit);
};

/**
 * IDs of published pages. Search uses them to exclude replaced package defaults, including pages that
 * did not match the term filter. The query does not read page records.
 */
export const listPublishedPageIds = async (db: RegistryDatabase): Promise<string[]> =>
  (await db.select({ id: pages.id }).from(pages)).map((row) => row.id);

export class RegistryTokenStore implements TokenStore {
  constructor(private readonly context: RegistryStoreContext) {}

  async listSets(): Promise<TokenSetRecord[]> {
    const rows = await this.context.db.select({ id: tokenSets.id, kind: tokenSets.kind, record: tokenSets.record }).from(tokenSets);
    return rows.map((row) => ({ id: row.id, kind: row.kind as TokenSetKind, record: row.record }));
  }

  async getSet(id: string): Promise<TokenSetRecord | null> {
    const rows = await this.context.db
      .select({ id: tokenSets.id, kind: tokenSets.kind, record: tokenSets.record })
      .from(tokenSets)
      .where(eq(tokenSets.id, id))
      .limit(1);
    const row = rows[0];
    return row ? { id: row.id, kind: row.kind as TokenSetKind, record: row.record } : null;
  }

  async getArtifacts(id: string): Promise<TokenArtifactResource[]> {
    const rows = await this.context.db
      .select({
        path: tokenArtifacts.path,
        format: tokenArtifacts.format,
        content: tokenArtifacts.content,
        contentType: tokenArtifacts.contentType,
      })
      .from(tokenArtifacts)
      .where(eq(tokenArtifacts.tokenSetId, id));
    return rows
      .filter((row) => row.content != null)
      .map((row) => ({ path: row.path, format: row.format, content: row.content as string, contentType: row.contentType }));
  }

  async getArtifact(id: string, format: string): Promise<TokenArtifactResource | null> {
    return (await this.getArtifacts(id)).find((artifact) => artifact.format === format) ?? null;
  }
}

const readableToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(
      Buffer.isBuffer(chunk) ? chunk : typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as unknown as Uint8Array)
    );
  }
  return Buffer.concat(chunks);
};

export class RegistryAssetStore implements AssetStore {
  constructor(private readonly context: RegistryStoreContext) {}

  async listCollections(): Promise<string[]> {
    const rows = await this.context.db.select({ collection: assetCollections.collection }).from(assetCollections);
    return rows.map((row) => row.collection);
  }

  async listAssets(collection: string): Promise<AssetMetadata[]> {
    const rows = await this.context.db
      .select({
        collection: assets.collection,
        path: assets.path,
        name: assets.name,
        contentType: assets.contentType,
        size: assets.size,
        contentHash: assets.contentHash,
        metadata: assets.metadata,
      })
      .from(assets)
      .where(eq(assets.collection, collection));
    return rows.map((row) => ({
      collection: row.collection,
      path: row.path,
      name: row.name,
      contentType: row.contentType,
      size: row.size ?? 0,
      contentHash: row.contentHash,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    }));
  }

  async getAsset(collection: string, assetPath: string): Promise<AssetMetadata | null> {
    return (await this.listAssets(collection)).find((asset) => asset.path === assetPath) ?? null;
  }

  async getAssetContent(collection: string, assetPath: string): Promise<AssetContentResource | null> {
    const rows = await this.context.db
      .select({
        name: assets.name,
        contentType: assets.contentType,
        size: assets.size,
        contentHash: assets.contentHash,
        metadata: assets.metadata,
        blobContent: assetBlobs.content,
        storageRef: assetBlobs.storageRef,
        storageProvider: assetBlobs.storageProvider,
      })
      .from(assets)
      .innerJoin(assetBlobs, eq(assets.blobHash, assetBlobs.hash))
      .where(and(eq(assets.collection, collection), eq(assets.path, assetPath)))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return null;
    }

    const base: AssetMetadata = {
      collection,
      path: assetPath,
      name: row.name,
      contentType: row.contentType,
      size: row.size ?? 0,
      contentHash: row.contentHash,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };

    // Inline (bytea, `database` provider) - return bytes directly.
    if (row.blobContent != null) {
      return { ...base, body: Buffer.from(row.blobContent as unknown as Uint8Array) };
    }

    // Object-backed - resolve through the provider that stored it.
    if (!row.storageRef || !this.context.resolveAssetAdapter) {
      return null;
    }
    const adapter = await this.context.resolveAssetAdapter(row.storageProvider);
    if (!adapter) {
      return null;
    }
    const result: AssetStorageReadResult = await adapter.get(row.storageRef);
    if (result.kind === 'redirect') {
      return { ...base, redirectUrl: result.url };
    }
    if (result.kind === 'bytes') {
      return { ...base, body: result.bytes };
    }
    return { ...base, body: await readableToBuffer(result.stream) };
  }
}

/** Build the database-backed store set for a registry database connection. */
export const createRegistryStore = (context: RegistryStoreContext): HandoffStore => ({
  components: new RegistryComponentStore(context),
  patterns: new RegistryPatternStore(context),
  pages: new RegistryPageStore(context),
  tokens: new RegistryTokenStore(context),
  assets: new RegistryAssetStore(context),
});
