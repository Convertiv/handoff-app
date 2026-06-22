import type { NextApiRequest, NextApiResponse } from 'next';
import { and, eq } from 'drizzle-orm';
import type { ArtifactKind, ArtifactOwnerKind } from '@handoff/artifacts/types';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import {
  buildMetadata,
  componentFiles,
  components,
  docsArtifacts,
  patternFiles,
  patterns,
} from '@handoff/registry/db/schema';
import type { TransferArtifact, TransferBuild, TransferEntityKind, TransferFile, TransferPackage } from '@handoff/registry/transfer';
import { sendRegistryError, type RegistryErrorDetails } from './errors';
import { isSafeRelativePath, normalizeRelativePath, validateFileBody } from './files';
import { handleRegistryRoute, sendRegistryData } from './handler';
import { buildMeta, resolveBuildMeta } from './meta';

/**
 * Publish ingestion for the registry transfer endpoint (technical design §10, issue #13).
 *
 * `PUT /api/registry/transfer/{component|pattern}/:id` is the **only** path allowed to set
 * render/build-defining fields, source files, rendered artifacts, and build metadata. It validates
 * the uploaded package against the transfer contract, then ingests it under the artifact ownership &
 * lifecycle rules (§8):
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

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? (value as string[]) : undefined;

/** Binds an entity kind to its tables and file foreign-key column. */
const ENTITY = {
  component: { table: components, filesTable: componentFiles, fileFk: componentFiles.componentId, fileFkName: 'componentId' as const },
  pattern: { table: patterns, filesTable: patternFiles, fileFk: patternFiles.patternId, fileFkName: 'patternId' as const },
};

/** Result of validating a publish package. Flat shape (the app compiles with `strictNullChecks` off). */
interface PackageValidation {
  ok: boolean;
  message?: string;
  details?: RegistryErrorDetails;
  value?: TransferPackage;
}

const invalid = (message: string, details?: RegistryErrorDetails): PackageValidation => ({ ok: false, message, details });

/**
 * Validate a publish package body against the transfer contract (§10). Checks the normalized record,
 * source-file kinds/paths (declarations rejected), artifact path-prefix/kind/owner rules, and the
 * `build.status: 'current'` provenance requirement. Required-reference presence is checked later
 * against the package + already-stored artifacts.
 */
const validatePackage = (body: unknown, kind: TransferEntityKind, id: string): PackageValidation => {
  if (!isPlainObject(body)) {
    return invalid('Request body must be a JSON object.');
  }

  // --- item (normalized record) ---
  const item = body.item;
  if (!isPlainObject(item)) {
    return invalid('A normalized `item` record is required to publish.', { rejectedFields: ['item'] });
  }
  const itemId = asString(item.id);
  if (itemId !== undefined && itemId !== id) {
    return invalid(`Package item id "${itemId}" does not match the publish target "${id}".`, { rejectedFields: ['item.id'] });
  }

  // --- files (declarations excluded; registry-safe paths) ---
  const rawFiles = body.files ?? [];
  if (!Array.isArray(rawFiles)) {
    return invalid('`files` must be an array.', { rejectedFields: ['files'] });
  }
  const files: TransferFile[] = [];
  for (let i = 0; i < rawFiles.length; i += 1) {
    const validation = validateFileBody(rawFiles[i]);
    if (!validation.ok) {
      return invalid(validation.message ?? 'Invalid source file in package.', {
        rejectedFields: (validation.rejectedFields ?? []).map((field) => `files[${i}].${field}`),
      });
    }
    files.push(validation.value);
  }

  // --- artifacts (path-prefix, kind, owner) ---
  const rawArtifacts = body.artifacts ?? [];
  if (!Array.isArray(rawArtifacts)) {
    return invalid('`artifacts` must be an array.', { rejectedFields: ['artifacts'] });
  }
  const artifacts: TransferArtifact[] = [];
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
    const ownerId = ownerKind === 'asset' ? null : asString(raw.ownerId) ?? null;
    if (ownerKind !== 'asset' && !ownerId) {
      return invalid(`Artifact "${artifactPath}" must name an ownerId for owner kind "${ownerKind}".`, {
        rejectedFields: [field('ownerId')],
      });
    }

    artifacts.push({
      path: artifactPath,
      artifactKind,
      content: raw.content as string,
      contentType: asString(raw.contentType) || 'text/plain; charset=utf-8',
      ownerKind,
      ownerId,
      references: Array.isArray(raw.references) ? (raw.references as TransferArtifact['references']) : undefined,
      formatVersion: asString(raw.formatVersion),
      hash: asString(raw.hash),
      size: typeof raw.size === 'number' ? raw.size : undefined,
    });
  }

  // --- build provenance ---
  if (!isPlainObject(body.build)) {
    return invalid('`build` metadata is required to publish.', { rejectedFields: ['build'] });
  }
  const status = asString(body.build.status);
  if (!status || !['current', 'stale', 'missing', 'error'].includes(status)) {
    return invalid('`build.status` must be one of current|stale|missing|error.', { rejectedFields: ['build.status'] });
  }
  const build: TransferBuild = {
    status: status as TransferBuild['status'],
    builtAt: asString(body.build.builtAt),
    builderVersion: asString(body.build.builderVersion),
    artifactHash: asString(body.build.artifactHash),
    sourceHash: asString(body.build.sourceHash),
    warnings: asStringArray(body.build.warnings),
    error: asString(body.build.error),
  };
  if (build.status === 'current' && (!build.builtAt || !build.builderVersion || !build.artifactHash)) {
    return invalid('A "current" build requires builtAt, builderVersion, and artifactHash.', {
      rejectedFields: ['build.builtAt', 'build.builderVersion', 'build.artifactHash'],
    });
  }

  return { ok: true, value: { item, files, artifacts, build } };
};

/** Whether an artifact path already exists in the registry (for required-reference checks). */
const artifactExists = async (db: RegistryDatabase, path: string): Promise<boolean> => {
  const rows = await db.select({ path: docsArtifacts.path }).from(docsArtifacts).where(eq(docsArtifacts.path, path)).limit(1);
  return rows.length > 0;
};

/**
 * Ensure every **required** structured reference is satisfied — present in the package or already
 * stored — so a published HTML artifact never depends on a missing required artifact (§10).
 */
const findMissingRequiredReference = async (
  db: RegistryDatabase,
  pkg: TransferPackage
): Promise<{ artifact: string; reference: string } | null> => {
  const packagePaths = new Set(pkg.artifacts.map((artifact) => artifact.path));
  for (const artifact of pkg.artifacts) {
    for (const reference of artifact.references ?? []) {
      if (!reference.required) {
        continue;
      }
      if (packagePaths.has(reference.path)) {
        continue;
      }
      if (!(await artifactExists(db, reference.path))) {
        return { artifact: artifact.path, reference: reference.path };
      }
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

  const base = {
    path: asString(item.path) || `${kind}/${id}`,
    title: asString(item.title),
    description: asString(item.description),
    group: asString(item.group),
    tags: asStringArray(item.tags),
    record,
    updatedAt: new Date(),
  };
  const values =
    kind === 'component'
      ? {
          ...base,
          type: asString(item.type) ?? '',
          renderer: asString(item.renderer),
          categories: asStringArray(item.categories),
        }
      : { ...base, components: Array.isArray(item.components) ? item.components : [] };

  if (existing[0]) {
    await db.update(spec.table).set(values as any).where(eq(spec.table.id, id));
    return;
  }
  await db.insert(spec.table).values({ id, metadata: null, ...values } as any);
};

/** Replace the entity's source files: drop all existing, then insert the package's files. */
const replaceEntityFiles = async (
  db: RegistryDatabase,
  kind: TransferEntityKind,
  id: string,
  files: TransferFile[]
): Promise<void> => {
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

/** Upsert the entity's build/provenance metadata. */
const upsertBuildMetadata = async (
  db: RegistryDatabase,
  kind: TransferEntityKind,
  id: string,
  build: TransferBuild
): Promise<void> => {
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
 * Handle `PUT /api/registry/transfer/{component|pattern}/:id` — validate and ingest a publish
 * package. Registry-runtime only; the bearer token is required (enforced by the guard stack).
 */
export const handleTransferRoute = (
  req: NextApiRequest,
  res: NextApiResponse,
  kind: TransferEntityKind
): Promise<void> =>
  handleRegistryRoute(req, res, ['PUT'], async ({ db }) => {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
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

    await upsertEntityRecord(db, kind, id, pkg.item);
    await replaceEntityFiles(db, kind, id, pkg.files);
    await ingestArtifacts(db, kind, id, pkg.artifacts);
    await upsertBuildMetadata(db, kind, id, pkg.build);

    sendRegistryData(res, 200, { id, kind, published: true }, buildMeta(await resolveBuildMeta(db, kind, id)));
  });
