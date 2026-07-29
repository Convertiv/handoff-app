import type { NextApiRequest, NextApiResponse } from 'next';
import { and, eq, inArray } from 'drizzle-orm';
import type { ArtifactKind, ArtifactOwnerKind, ArtifactReference, ArtifactReferenceKind } from '@handoff/artifacts/types';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import { isSafePathSegment, isSafeRelativePath } from '@handoff/registry/path';
import {
  buildMetadata,
  componentFiles,
  components,
  docsArtifacts,
  pageFiles,
  pages,
  patternFiles,
  patterns,
} from '@handoff/registry/db/schema';
import type { TransferArtifact, TransferBuild, TransferEntityKind, TransferFile, TransferPackage } from '@handoff/registry/transfer';
import { singleQueryValue } from '../api/query';
import { sendRegistryError } from './errors';
import { validateFileBody } from './files';
import { handleRegistryRoute, sendRegistryData } from './handler';
import { buildMeta, resolveBuildMeta } from './meta';
import { revalidateEntityPages } from './revalidate';
import { getEntity, listEntityFiles } from './store';
import {
  asString,
  invalidPackage as invalid,
  isPlainObject,
  normalizeSafeRelativePath,
  type PackageValidation,
  validateTransferBuild,
} from './validation';

/**
 * Publish ingestion for the registry transfer endpoint.
 *
 * `PUT /api/registry/transfer/{component|pattern}/:id` is the **only** path allowed to set
 * render/build-defining fields, source files, rendered artifacts, and build metadata. It validates
 * the uploaded package against the transfer contract, then ingests it under the artifact ownership &
 * lifecycle rules:
 *
 * - The published entity's own record/files/artifacts are **replaced**.
 * - Shared/global artifacts (`component/main.{css,js}`, `component/shared.css`) are **upserted when
 *   present, never deleted when omitted**, so a publish that omits them preserves them for entities
 *   that still depend on them.
 * - A pattern may carry required component artifacts; those are upserted, not replaced, so unrelated
 *   entities' artifacts are never touched.
 *
 * Runs behind {@link handleRegistryRoute}, so the runtime-mode, method, bearer-token, and database
 * guards apply before any of this executes.
 */

const VALID_ARTIFACT_KINDS = new Set<ArtifactKind>(['json', 'html', 'css', 'javascript', 'other']);
const VALID_OWNER_KINDS = new Set<ArtifactOwnerKind>(['component', 'pattern', 'asset']);
const VALID_REFERENCE_KINDS = new Set<ArtifactReferenceKind>(['client', 'style', 'script', 'shared', 'other']);

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? (value as string[]) : undefined;

/** Binds an entity kind to its tables and file foreign-key column. */
const ENTITY = {
  component: { table: components, filesTable: componentFiles, fileFk: componentFiles.componentId, fileFkName: 'componentId' as const },
  pattern: { table: patterns, filesTable: patternFiles, fileFk: patternFiles.patternId, fileFkName: 'patternId' as const },
  page: { table: pages, filesTable: pageFiles, fileFk: pageFiles.pageId, fileFkName: 'pageId' as const },
};

/**
 * Validate a publish package body against the transfer contract. Checks the normalized record,
 * source-file kinds/paths (declarations rejected), artifact path-prefix/kind/owner rules, and the
 * required build hash for `build.status: 'current'`. Required reference presence is checked later
 * against the package + already-stored artifacts.
 */
const validatePackage = (body: unknown, kind: TransferEntityKind, id: string): PackageValidation<TransferPackage> => {
  const validId = kind === 'page' ? isSafeRelativePath(id) : isSafePathSegment(id);
  if (!validId) {
    return invalid('Publish target id must be a registry-safe relative path.', { rejectedFields: ['id'] });
  }
  if (!isPlainObject(body)) {
    return invalid('Request body must be a JSON object.');
  }

  const item = body.item;
  if (!isPlainObject(item)) {
    return invalid('A normalized `item` record is required to publish.', { rejectedFields: ['item'] });
  }
  const itemId = asString(item.id);
  if (itemId !== undefined && itemId !== id) {
    return invalid(`Package item id "${itemId}" does not match the publish target "${id}".`, { rejectedFields: ['item.id'] });
  }

  const rawFiles = body.files ?? [];
  if (!Array.isArray(rawFiles)) {
    return invalid('`files` must be an array.', { rejectedFields: ['files'] });
  }
  const files: TransferFile[] = [];
  const seenFilePaths = new Set<string>();
  for (let i = 0; i < rawFiles.length; i += 1) {
    const validation = validateFileBody(rawFiles[i]);
    if (!validation.ok) {
      return invalid(validation.message ?? 'Invalid source file in package.', {
        rejectedFields: (validation.rejectedFields ?? []).map((field) => `files[${i}].${field}`),
      });
    }
    if (seenFilePaths.has(validation.value.path)) {
      return invalid(`Duplicate source file path "${validation.value.path}" in package.`, {
        rejectedFields: [`files[${i}].path`],
      });
    }
    seenFilePaths.add(validation.value.path);
    files.push(validation.value);
  }

  const rawArtifacts = body.artifacts ?? [];
  if (!Array.isArray(rawArtifacts)) {
    return invalid('`artifacts` must be an array.', { rejectedFields: ['artifacts'] });
  }
  if (kind === 'page' && rawArtifacts.length > 0) {
    return invalid('Page publishes cannot contain rendered artifacts.', { rejectedFields: ['artifacts'] });
  }
  const artifacts: TransferArtifact[] = [];
  const seenPaths = new Set<string>();
  for (let i = 0; i < rawArtifacts.length; i += 1) {
    const raw = rawArtifacts[i];
    const field = (name: string) => `artifacts[${i}].${name}`;
    if (!isPlainObject(raw)) {
      return invalid('Each artifact must be an object.', { rejectedFields: [`artifacts[${i}]`] });
    }
    const artifactPath = normalizeSafeRelativePath(raw.path);
    if (!artifactPath) {
      return invalid('Artifact path must be a registry-safe relative path.', { rejectedFields: [field('path')] });
    }
    const allowedPrefixes = kind === 'component' ? ['component/'] : ['pattern/', 'component/'];
    if (!allowedPrefixes.some((prefix) => artifactPath.startsWith(prefix))) {
      return invalid(
        `Artifact "${artifactPath}" is not allowed for a ${kind} publish (expected a path under ${allowedPrefixes
          .map((p) => `"${p}"`)
          .join(' or ')}).`,
        { rejectedFields: [field('path')] }
      );
    }
    if (seenPaths.has(artifactPath)) {
      return invalid(`Duplicate artifact path "${artifactPath}" in package.`, { rejectedFields: [field('path')] });
    }
    seenPaths.add(artifactPath);

    const artifactKind = asString(raw.artifactKind) as ArtifactKind | undefined;
    if (!artifactKind || !VALID_ARTIFACT_KINDS.has(artifactKind)) {
      return invalid(`Artifact "${artifactPath}" has an invalid artifactKind.`, { rejectedFields: [field('artifactKind')] });
    }
    if (typeof raw.content !== 'string') {
      return invalid(`Artifact "${artifactPath}" is missing string content.`, { rejectedFields: [field('content')] });
    }
    const ownerKind = (asString(raw.ownerKind) as ArtifactOwnerKind | undefined) ?? undefined;
    if (!ownerKind || !VALID_OWNER_KINDS.has(ownerKind)) {
      return invalid(`Artifact "${artifactPath}" has an invalid ownerKind.`, { rejectedFields: [field('ownerKind')] });
    }
    const ownerId = ownerKind === 'asset' ? null : (asString(raw.ownerId) ?? null);
    if (ownerKind !== 'asset' && !ownerId) {
      return invalid(`Artifact "${artifactPath}" must name an ownerId for owner kind "${ownerKind}".`, {
        rejectedFields: [field('ownerId')],
      });
    }
    if (ownerKind === 'component' && kind === 'component' && ownerId !== id) {
      return invalid(`Artifact "${artifactPath}" cannot be owned by another component.`, {
        rejectedFields: [field('ownerId')],
      });
    }
    if (ownerKind === 'pattern' && (kind !== 'pattern' || ownerId !== id)) {
      return invalid(`Artifact "${artifactPath}" must be owned by the target pattern.`, {
        rejectedFields: [field('ownerId')],
      });
    }
    if (ownerKind === 'component' && !artifactPath.startsWith('component/')) {
      return invalid(`Component artifact "${artifactPath}" must use the component path prefix.`, {
        rejectedFields: [field('path')],
      });
    }
    if (ownerKind === 'pattern' && !artifactPath.startsWith('pattern/')) {
      return invalid(`Pattern artifact "${artifactPath}" must use the pattern path prefix.`, {
        rejectedFields: [field('path')],
      });
    }

    let references: ArtifactReference[] | undefined;
    if (raw.references !== undefined) {
      if (!Array.isArray(raw.references)) {
        return invalid(`Artifact "${artifactPath}" references must be an array.`, {
          rejectedFields: [field('references')],
        });
      }
      references = [];
      for (let referenceIndex = 0; referenceIndex < raw.references.length; referenceIndex += 1) {
        const reference = raw.references[referenceIndex];
        const referenceField = (name: string) => `${field('references')}[${referenceIndex}].${name}`;
        if (!isPlainObject(reference)) {
          return invalid(`Artifact "${artifactPath}" contains an invalid reference.`, {
            rejectedFields: [`${field('references')}[${referenceIndex}]`],
          });
        }
        const referencePath = normalizeSafeRelativePath(reference.path);
        const referenceKind = asString(reference.kind) as ArtifactReferenceKind | undefined;
        if (!referencePath) {
          return invalid(`Artifact "${artifactPath}" contains an unsafe reference path.`, {
            rejectedFields: [referenceField('path')],
          });
        }
        if (!referenceKind || !VALID_REFERENCE_KINDS.has(referenceKind)) {
          return invalid(`Artifact "${artifactPath}" contains an invalid reference kind.`, {
            rejectedFields: [referenceField('kind')],
          });
        }
        if (typeof reference.required !== 'boolean') {
          return invalid(`Artifact "${artifactPath}" reference must declare whether it is required.`, {
            rejectedFields: [referenceField('required')],
          });
        }
        const referenceOwnerKind = asString(reference.ownerKind) as ArtifactOwnerKind | undefined;
        if (referenceOwnerKind && !VALID_OWNER_KINDS.has(referenceOwnerKind)) {
          return invalid(`Artifact "${artifactPath}" contains an invalid reference owner.`, {
            rejectedFields: [referenceField('ownerKind')],
          });
        }
        references.push({
          path: referencePath,
          kind: referenceKind,
          required: reference.required,
          ...(referenceOwnerKind ? { ownerKind: referenceOwnerKind } : {}),
          ...(referenceOwnerKind ? { ownerId: referenceOwnerKind === 'asset' ? null : (asString(reference.ownerId) ?? null) } : {}),
          ...(asString(reference.contentType) ? { contentType: asString(reference.contentType) } : {}),
          ...(asString(reference.formatVersion) ? { formatVersion: asString(reference.formatVersion) } : {}),
          ...(asString(reference.buildId) ? { buildId: asString(reference.buildId) } : {}),
          ...(asString(reference.hash) ? { hash: asString(reference.hash) } : {}),
          ...(typeof reference.size === 'number' ? { size: reference.size } : {}),
        });
      }
    }

    artifacts.push({
      path: artifactPath,
      artifactKind,
      content: raw.content as string,
      contentType: asString(raw.contentType) || 'text/plain; charset=utf-8',
      ownerKind,
      ownerId,
      references,
      formatVersion: asString(raw.formatVersion),
      hash: asString(raw.hash),
      size: typeof raw.size === 'number' ? raw.size : undefined,
    });
  }

  const buildValidation = validateTransferBuild(body.build, {
    requiredHashField: kind === 'page' ? 'sourceHash' : 'artifactHash',
    currentMessage:
      kind === 'page'
        ? 'A "current" page build requires builtAt, builderVersion, and sourceHash.'
        : 'A "current" build requires builtAt, builderVersion, and artifactHash.',
  });
  if (!buildValidation.ok) {
    return invalid(buildValidation.message, buildValidation.details);
  }

  return { ok: true, value: { item, files, artifacts, build: buildValidation.value } };
};

/**
 * Ensure every **required** structured reference is satisfied — present in the package or already
 * stored — so a published HTML artifact never depends on a missing required artifact.
 */
const findMissingRequiredReference = async (
  db: RegistryDatabase,
  pkg: TransferPackage
): Promise<{ artifact: string; reference: string } | null> => {
  const packagePaths = new Set(pkg.artifacts.map((artifact) => artifact.path));
  const requiredReferences = pkg.artifacts.flatMap((artifact) =>
    (artifact.references ?? [])
      .filter((reference) => reference.required)
      .map((reference) => ({ artifact: artifact.path, reference: reference.path }))
  );
  const storedCandidates = Array.from(
    new Set(requiredReferences.map(({ reference }) => reference).filter((path) => !packagePaths.has(path)))
  );
  const storedPaths = new Set<string>();
  if (storedCandidates.length > 0) {
    const rows = await db
      .select({ path: docsArtifacts.path, content: docsArtifacts.content })
      .from(docsArtifacts)
      .where(inArray(docsArtifacts.path, storedCandidates));
    rows.forEach(({ path, content }) => {
      if (content != null) {
        storedPaths.add(path);
      }
    });
  }

  for (const required of requiredReferences) {
    if (!packagePaths.has(required.reference) && !storedPaths.has(required.reference)) {
      return required;
    }
  }
  return null;
};

/** Upsert the entity's normalized record + promoted columns, preserving existing review metadata. */
const upsertEntityRecord = async (
  db: RegistryDatabase,
  kind: TransferEntityKind,
  id: string,
  item: Record<string, unknown>
): Promise<void> => {
  const spec = ENTITY[kind];
  const record = { ...item, id };
  const existing = await db.select({ id: spec.table.id }).from(spec.table).where(eq(spec.table.id, id)).limit(1);

  // `tags` is promoted on components/patterns only; the pages table has no such column.
  const base = {
    path: asString(item.path) || `${kind}/${id}`,
    title: asString(item.title),
    description: asString(item.description),
    group: asString(item.group),
    record,
    updatedAt: new Date(),
  };
  const values =
    kind === 'component'
      ? {
          ...base,
          tags: asStringArray(item.tags),
          type: asString(item.type) ?? '',
          renderer: asString(item.renderer),
          categories: asStringArray(item.categories),
        }
      : kind === 'pattern'
        ? { ...base, tags: asStringArray(item.tags), components: Array.isArray(item.components) ? item.components : [] }
        : { ...base, weight: typeof item.weight === 'number' ? item.weight : null };

  if (existing[0]) {
    await db
      .update(spec.table)
      .set(values as any)
      .where(eq(spec.table.id, id));
    return;
  }
  await db.insert(spec.table).values({ id, metadata: null, ...values } as any);
};

/** Replace the entity's source files: drop all existing, then insert the package's files. */
const replaceEntityFiles = async (db: RegistryDatabase, kind: TransferEntityKind, id: string, files: TransferFile[]): Promise<void> => {
  const spec = ENTITY[kind];
  await db.delete(spec.filesTable).where(eq(spec.fileFk, id));
  for (const file of files) {
    await db.insert(spec.filesTable).values({
      [spec.fileFkName]: id,
      path: file.path,
      kind: file.kind,
      content: file.content,
      contentType: file.contentType,
    } as any);
  }
};

/**
 * Ingest the package's artifacts under the lifecycle rules: replace the publishing entity's own
 * artifacts (delete its prior set, then upsert), while shared and cross-entity (pattern-carried
 * component) artifacts are upserted by path without disturbing anything they do not key.
 */
const ingestArtifacts = async (
  db: RegistryDatabase,
  kind: TransferEntityKind,
  id: string,
  artifacts: TransferArtifact[]
): Promise<void> => {
  // Replace only the publishing entity's own artifacts; shared (`asset`) and other entities' rows are
  // keyed by a different (entityKind, entityId) and are never deleted here.
  await db.delete(docsArtifacts).where(and(eq(docsArtifacts.entityKind, kind), eq(docsArtifacts.entityId, id)));

  for (const artifact of artifacts) {
    const entityKind = artifact.ownerKind;
    const entityId = artifact.ownerKind === 'asset' ? null : artifact.ownerId;
    await db
      .insert(docsArtifacts)
      .values({
        path: artifact.path,
        entityKind,
        entityId,
        artifactKind: artifact.artifactKind,
        content: artifact.content,
        contentType: artifact.contentType,
        ownerKind: artifact.ownerKind,
        ownerId: artifact.ownerId,
        references: artifact.references ?? null,
        formatVersion: artifact.formatVersion ?? null,
        hash: artifact.hash ?? null,
        size: artifact.size ?? null,
      } as any)
      .onConflictDoUpdate({
        target: docsArtifacts.path,
        set: {
          entityKind,
          entityId,
          artifactKind: artifact.artifactKind,
          content: artifact.content,
          contentType: artifact.contentType,
          ownerKind: artifact.ownerKind,
          ownerId: artifact.ownerId,
          references: artifact.references ?? null,
          formatVersion: artifact.formatVersion ?? null,
          hash: artifact.hash ?? null,
          size: artifact.size ?? null,
          updatedAt: new Date(),
        },
      });
  }
};

/** Upsert the entity's build metadata. */
const upsertBuildMetadata = async (db: RegistryDatabase, kind: TransferEntityKind, id: string, build: TransferBuild): Promise<void> => {
  const values = {
    entityKind: kind,
    entityId: id,
    status: build.status,
    builtAt: build.builtAt ? new Date(build.builtAt) : null,
    builderVersion: build.builderVersion ?? null,
    artifactHash: build.artifactHash ?? null,
    sourceHash: build.sourceHash ?? null,
    warnings: build.warnings ?? null,
    error: build.error ?? null,
    updatedAt: new Date(),
  };
  await db
    .insert(buildMetadata)
    .values(values as any)
    .onConflictDoUpdate({ target: [buildMetadata.entityKind, buildMetadata.entityId], set: values as any });
};

/**
 * Handles `GET /api/registry/transfer/{component|pattern|page}`. Lists summaries for one kind of
 * entity: each id plus its build hashes and status. A connected workspace uses these to skip
 * unchanged entities on a bulk publish and to enumerate published ids for a bulk checkout. Requires
 * a `registry:read` token (enforced by the guard stack).
 */
export const handleEntitySummaryRoute = (req: NextApiRequest, res: NextApiResponse, kind: TransferEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['GET'], async ({ db }) => {
    const table = ENTITY[kind].table;
    const rows = await db
      .select({
        id: table.id,
        status: buildMetadata.status,
        artifactHash: buildMetadata.artifactHash,
        sourceHash: buildMetadata.sourceHash,
      })
      .from(table)
      .leftJoin(buildMetadata, and(eq(buildMetadata.entityKind, kind), eq(buildMetadata.entityId, table.id)));

    const entities = rows.map((row) => ({
      id: row.id,
      kind,
      status: row.status ?? undefined,
      artifactHash: row.artifactHash ?? undefined,
      sourceHash: row.sourceHash ?? undefined,
    }));
    sendRegistryData(res, 200, { entities }, buildMeta());
  });

/**
 * Handle `GET /api/registry/transfer/{component|pattern}/:id` — checkout read. Returns the
 * normalized record plus its registry-safe source files so a connected workspace can reconstruct
 * the entity locally. Declaration files are workspace-only: registry stores never hold them, but
 * they are filtered defensively so checkout never receives one. Requires a `registry:read` token
 * (enforced by the guard stack).
 */
export const handleCheckoutRoute = (req: NextApiRequest, res: NextApiResponse, kind: TransferEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['GET'], async ({ db }) => {
    const id = singleQueryValue(req.query.id);
    if (!id) {
      sendRegistryError(res, 'not_found', `Missing ${kind} id.`);
      return;
    }
    const validId = kind === 'page' ? isSafeRelativePath(id) : isSafePathSegment(id);
    if (!validId) {
      sendRegistryError(res, 'bad_request', 'Entity id must be a registry-safe relative path.', {
        rejectedFields: ['id'],
      });
      return;
    }

    const entity = await getEntity(db, kind, id);
    if (!entity) {
      sendRegistryError(res, 'not_found', `No ${kind} "${id}" exists in the registry.`);
      return;
    }

    // Declarations are workspace-only and are never persisted as registry file records (their kind
    // is excluded from `RegistryTextFileKind`), so the stored files are already declaration-free.
    const files = await listEntityFiles(db, kind, id);

    sendRegistryData(res, 200, { kind, item: entity.data, files }, buildMeta(entity.build));
  });

/**
 * Handle `PUT /api/registry/transfer/{component|pattern}/:id` — validate and ingest a publish
 * package. Registry-runtime only; the bearer token is required (enforced by the guard stack).
 */
export const handleTransferRoute = (req: NextApiRequest, res: NextApiResponse, kind: TransferEntityKind): Promise<void> =>
  handleRegistryRoute(req, res, ['PUT'], async ({ db }) => {
    const id = singleQueryValue(req.query.id);
    if (!id) {
      sendRegistryError(res, 'not_found', `Missing ${kind} id.`);
      return;
    }

    const validation = validatePackage(req.body, kind, id);
    if (!validation.ok) {
      sendRegistryError(res, 'bad_request', validation.message ?? 'Invalid publish package.', validation.details);
      return;
    }
    const pkg = validation.value;

    const missing = await findMissingRequiredReference(db, pkg);
    if (missing) {
      sendRegistryError(
        res,
        'bad_request',
        `Required artifact "${missing.reference}" referenced by "${missing.artifact}" is neither in the package nor already published.`,
        { rejectedFields: ['artifacts'], missingReference: missing.reference }
      );
      return;
    }

    await db.transaction(async (tx) => {
      const transactionalDb = tx as unknown as RegistryDatabase;
      await upsertEntityRecord(transactionalDb, kind, id, pkg.item);
      await replaceEntityFiles(transactionalDb, kind, id, pkg.files);
      await ingestArtifacts(transactionalDb, kind, id, pkg.artifacts);
      await upsertBuildMetadata(transactionalDb, kind, id, pkg.build);
    });

    // The publish persisted; regenerate the affected docs pages on demand so the served pages reflect
    // the new content immediately (correct server-rendered `<head>` title/metadata).
    await revalidateEntityPages(res, kind, id);

    sendRegistryData(res, 200, { id, kind, published: true }, buildMeta(await resolveBuildMeta(db, kind, id)));
  });
