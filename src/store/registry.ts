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

import { and, eq, inArray, or, sql, type SQLWrapper } from 'drizzle-orm';
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

/**
 * The page fields that search reads. The query strips frontmatter from the body, cuts it to `bodyLength`, and returns
 * an empty body for a page with no stored markdown.
 */
export interface PageSearchCandidate {
  record: PageListObject;
  body: string;
}

export interface PageSearchCandidateQuery {
  /** Normalized terms. A page is a candidate when any term occurs in any searchable column. */
  terms: string[];
  /** Optional group filter, matched case-insensitively. */
  group?: string;
  /** Maximum rows returned to the server for one search. */
  limit: number;
  /**
   * Characters of each returned body, and the prefix the body filter reads, so one search costs at most
   * `limit × bodyLength`. Workspace search must cut at the same length, or the modes match different text.
   */
  bodyLength: number;
}

/** Escape the wildcards Postgres reads in an `ILIKE` pattern, so a term cannot widen its own match. */
const likePattern = (term: string): string => `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/**
 * Strip a leading `---` frontmatter block, so the body filter reads the text that ranking scores.
 *
 * The first quantifier must stay non-greedy. Postgres takes the greediness of the whole pattern from
 * it, and a greedy pattern would strip through the last `---` line of the body.
 */
const FRONTMATTER_PATTERN = '^---.*?\\n---[^\\n]*(\\n|$)';

/**
 * Candidate pages for a search, filtered and capped in SQL.
 *
 * `enabled` and `menuTitle` are fields in the `record` JSON, so the query uses JSON operators. An
 * absent `enabled` field means enabled. The body filter excludes frontmatter, so an excluded field
 * such as `metaTitle` cannot consume a candidate slot.
 *
 * The filter and the projection share one body expression, so every term SQL matched is inside the text that the
 * server ranks. Postgres thus strips each row twice, which costs much less than the return of an unbounded body.
 *
 * `C` collation orders IDs by code point, as the merge in registry search does. Both orders must
 * agree, or the cap can keep different pages in each runtime mode.
 */
export const searchPageCandidates = async (db: RegistryDatabase, query: PageSearchCandidateQuery): Promise<PageSearchCandidate[]> => {
  // No term means no candidate, and an empty list would build `array[]`, which Postgres cannot type.
  if (query.terms.length === 0) {
    return [];
  }
  const patterns = sql.join(
    query.terms.map((term) => sql`${likePattern(term)}`),
    sql`, `
  );
  const matchesAnyTerm = (text: SQLWrapper) => sql`${text} ilike any (array[${patterns}])`;
  const body = sql<string>`left(regexp_replace(coalesce(${pageFiles.content}, ''), ${FRONTMATTER_PATTERN}, ''), ${query.bodyLength})`;

  return db
    .select({ record: pages.record, body })
    .from(pages)
    .leftJoin(pageFiles, and(eq(pageFiles.pageId, pages.id), eq(pageFiles.kind, 'markdown')))
    .where(
      and(
        sql`${pages.record}->>'enabled' is distinct from 'false'`,
        query.group ? sql`lower(${pages.group}) = lower(${query.group})` : undefined,
        or(
          matchesAnyTerm(pages.title),
          matchesAnyTerm(pages.description),
          matchesAnyTerm(sql`${pages.record}->>'menuTitle'`),
          matchesAnyTerm(body)
        )
      )
    )
    .orderBy(sql`${pages.id} collate "C"`)
    .limit(query.limit);
};

/**
 * The published pages among the given IDs. Search asks only about packaged default IDs, because no
 * other ID can replace a default. This keeps the query bounded as the registry grows.
 *
 * A published page replaces the default with the same ID even when it does not match the search
 * terms, so this query ignores the term filter.
 */
export const findPublishedPageIds = async (db: RegistryDatabase, ids: string[]): Promise<string[]> => {
  if (ids.length === 0) {
    return [];
  }
  const rows = await db.select({ id: pages.id }).from(pages).where(inArray(pages.id, ids));
  return rows.map((row) => row.id);
};

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
