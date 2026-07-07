import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { tokenArtifacts, tokenSets } from '@handoff/registry/db/schema';
import { kindForSetId } from '@handoff/registry/tokens/sets';
import type { TokenSetTransferArtifact, TokenSetTransferPackage } from '@handoff/registry/tokens/transfer';
import { sendRegistryError, type RegistryErrorDetails } from './errors';
import { isSafeRelativePath, normalizeRelativePath } from './files';
import { buildMeta } from './meta';
import { handleRegistryRoute, sendRegistryData } from './handler';

/**
 * Token-set transfer ingestion for the registry.
 *
 * - `GET /api/registry/transfer/tokens` lists set summaries (id + kind + source hash) for the CLI's
 *   skip-unchanged / bulk-checkout logic.
 * - `GET /api/registry/transfer/tokens/:setId` is checkout: the set record + its generated artifacts.
 * - `PUT /api/registry/transfer/tokens/:setId` is publish ingestion: it validates the package and
 *   atomically upserts the `token_sets` row and replaces its `token_artifacts` in one transaction, so
 *   a set is never left partially written — either the new version commits or the previous one stays.
 *   An unchanged set (matching `sourceHash`) is a no-op. Absent sets are never deleted.
 *
 * Runs behind {@link handleRegistryRoute}: runtime-mode, method, bearer-token (on PUT), and database
 * guards apply before any of this executes.
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

interface PackageValidation {
  ok: boolean;
  message?: string;
  details?: RegistryErrorDetails;
  value?: TokenSetTransferPackage;
}

const invalid = (message: string, details?: RegistryErrorDetails): PackageValidation => ({ ok: false, message, details });

/** Validate a token-set publish package against the transfer contract. */
const validateTokenPackage = (body: unknown, setId: string): PackageValidation => {
  if (!isPlainObject(body)) {
    return invalid('Request body must be a JSON object.');
  }

  const bodyId = asString(body.id);
  if (bodyId !== undefined && bodyId !== setId) {
    return invalid(`Package set id "${bodyId}" does not match the publish target "${setId}".`, { rejectedFields: ['id'] });
  }

  const expectedKind = kindForSetId(setId);
  const kind = asString(body.kind) ?? expectedKind;
  if (kind !== 'foundation' && kind !== 'component') {
    return invalid('`kind` must be "foundation" or "component".', { rejectedFields: ['kind'] });
  }
  if (kind !== expectedKind) {
    return invalid(`Package kind "${kind}" is inconsistent with set id "${setId}".`, { rejectedFields: ['kind'] });
  }

  if (body.record === undefined || body.record === null) {
    return invalid('A token `record` is required to publish.', { rejectedFields: ['record'] });
  }

  const rawArtifacts = body.artifacts ?? [];
  if (!Array.isArray(rawArtifacts)) {
    return invalid('`artifacts` must be an array.', { rejectedFields: ['artifacts'] });
  }
  const artifacts: TokenSetTransferArtifact[] = [];
  const seenPaths = new Set<string>();
  for (let i = 0; i < rawArtifacts.length; i += 1) {
    const raw = rawArtifacts[i];
    const field = (name: string) => `artifacts[${i}].${name}`;
    if (!isPlainObject(raw)) {
      return invalid('Each artifact must be an object.', { rejectedFields: [`artifacts[${i}]`] });
    }
    const rawPath = asString(raw.path);
    if (!rawPath || !isSafeRelativePath(rawPath)) {
      return invalid('Artifact path must be a registry-safe relative path.', { rejectedFields: [field('path')] });
    }
    const artifactPath = normalizeRelativePath(rawPath);
    if (seenPaths.has(artifactPath)) {
      return invalid(`Duplicate artifact path "${artifactPath}" in package.`, { rejectedFields: [field('path')] });
    }
    seenPaths.add(artifactPath);
    if (typeof raw.content !== 'string') {
      return invalid(`Artifact "${artifactPath}" is missing string content.`, { rejectedFields: [field('content')] });
    }
    const format = asString(raw.format);
    if (!format) {
      return invalid(`Artifact "${artifactPath}" is missing a format.`, { rejectedFields: [field('format')] });
    }
    artifacts.push({
      path: artifactPath,
      format,
      content: raw.content as string,
      contentType: asString(raw.contentType) || 'text/plain; charset=utf-8',
      hash: asString(raw.hash),
      size: typeof raw.size === 'number' ? raw.size : undefined,
    });
  }

  if (!isPlainObject(body.build)) {
    return invalid('`build` metadata is required to publish.', { rejectedFields: ['build'] });
  }
  const status = asString(body.build.status);
  if (!status || !['current', 'stale', 'missing', 'error'].includes(status)) {
    return invalid('`build.status` must be one of current|stale|missing|error.', { rejectedFields: ['build.status'] });
  }
  if (status === 'current' && (!asString(body.build.builtAt) || !asString(body.build.builderVersion) || !asString(body.build.sourceHash))) {
    return invalid('A "current" token build requires builtAt, builderVersion, and sourceHash.', {
      rejectedFields: ['build.builtAt', 'build.builderVersion', 'build.sourceHash'],
    });
  }

  return {
    ok: true,
    value: {
      id: setId,
      kind,
      record: body.record,
      artifacts,
      build: {
        status: status as TokenSetTransferPackage['build']['status'],
        builtAt: asString(body.build.builtAt),
        builderVersion: asString(body.build.builderVersion),
        sourceHash: asString(body.build.sourceHash),
      },
    },
  };
};

/** The stored source hash for a set, or `undefined` when the set does not exist yet. */
const storedSourceHash = async (db: RegistryDatabase, id: string): Promise<string | null | undefined> => {
  const rows = await db.select({ sourceHash: tokenSets.sourceHash }).from(tokenSets).where(eq(tokenSets.id, id)).limit(1);
  return rows.length ? rows[0].sourceHash : undefined;
};

/** Atomically upsert the set row and replace its artifacts in one transaction. */
const ingestTokenSet = async (db: RegistryDatabase, pkg: TokenSetTransferPackage): Promise<void> => {
  const setValues = {
    kind: pkg.kind,
    record: pkg.record,
    sourceHash: pkg.build.sourceHash ?? null,
    status: pkg.build.status,
    builtAt: pkg.build.builtAt ? new Date(pkg.build.builtAt) : null,
    builderVersion: pkg.build.builderVersion ?? null,
    updatedAt: new Date(),
  };

  await db.transaction(async (tx) => {
    await tx
      .insert(tokenSets)
      .values({ id: pkg.id, metadata: null, ...setValues } as any)
      .onConflictDoUpdate({ target: tokenSets.id, set: setValues as any });

    await tx.delete(tokenArtifacts).where(eq(tokenArtifacts.tokenSetId, pkg.id));
    for (const artifact of pkg.artifacts) {
      await tx.insert(tokenArtifacts).values({
        tokenSetId: pkg.id,
        path: artifact.path,
        format: artifact.format,
        content: artifact.content,
        contentType: artifact.contentType,
        hash: artifact.hash ?? null,
        size: artifact.size ?? null,
      } as any);
    }
  });
};

/** Recover the (multi-segment) set id from the catch-all `[...setId]` route param. */
const setIdFromQuery = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value.join('/') : value ?? '';

/** `GET /api/registry/transfer/tokens` — list set summaries (unauthenticated read behind the guards). */
export const handleTokenSummaryRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['GET'], async ({ db }) => {
    const rows = await db
      .select({ id: tokenSets.id, kind: tokenSets.kind, sourceHash: tokenSets.sourceHash, status: tokenSets.status })
      .from(tokenSets);
    sendRegistryData(res, 200, { sets: rows }, buildMeta());
  });

/** `GET /api/registry/transfer/tokens/:setId` — checkout one set's record + generated artifacts. */
export const handleTokenCheckoutRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['GET'], async ({ db }) => {
    const id = setIdFromQuery(req.query.setId);
    if (!id) {
      sendRegistryError(res, 'not_found', 'Missing token set id.');
      return;
    }
    const rows = await db.select({ kind: tokenSets.kind, record: tokenSets.record }).from(tokenSets).where(eq(tokenSets.id, id)).limit(1);
    const set = rows[0];
    if (!set) {
      sendRegistryError(res, 'not_found', `No token set "${id}" exists in the registry.`);
      return;
    }
    const artifacts = await db
      .select({ path: tokenArtifacts.path, format: tokenArtifacts.format, content: tokenArtifacts.content, contentType: tokenArtifacts.contentType, hash: tokenArtifacts.hash, size: tokenArtifacts.size })
      .from(tokenArtifacts)
      .where(eq(tokenArtifacts.tokenSetId, id));
    sendRegistryData(res, 200, { id, kind: set.kind, record: set.record, artifacts }, buildMeta());
  });

/** `PUT /api/registry/transfer/tokens/:setId` — validate + atomically ingest one set. */
export const handleTokenTransferRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> =>
  handleRegistryRoute(req, res, ['PUT'], async ({ db }) => {
    const id = setIdFromQuery(req.query.setId);
    if (!id) {
      sendRegistryError(res, 'not_found', 'Missing token set id.');
      return;
    }

    const validation = validateTokenPackage(req.body, id);
    if (!validation.ok) {
      sendRegistryError(res, 'bad_request', validation.message ?? 'Invalid token set package.', validation.details);
      return;
    }
    const pkg = validation.value;

    const existingHash = await storedSourceHash(db, id);
    if (existingHash && pkg.build.sourceHash && existingHash === pkg.build.sourceHash) {
      sendRegistryData(res, 200, { id, kind: pkg.kind, published: false, unchanged: true }, buildMeta());
      return;
    }

    await ingestTokenSet(db, pkg);
    sendRegistryData(res, 200, { id, kind: pkg.kind, published: true, artifacts: pkg.artifacts.length }, buildMeta());
  });
