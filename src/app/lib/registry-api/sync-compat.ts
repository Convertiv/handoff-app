import type { NextApiRequest, NextApiResponse } from 'next';
import { ENTITY_WIRE_KIND, isRegistryEntityKind, type RegistryEntityKind } from '@handoff/registry/content-kinds';
import { sendRegistryError } from './errors';
import { handleRegistryRoute } from './handler';
import { revalidateEntityBatch, type RevalidatableEntityKind } from './revalidate';
import { applyTransferBatch, type TransferBatchItem, type TransferBatchOp, type TransferBatchOutcome } from './transfer-batch';
import { isPlainObject } from './validation';

/**
 * Deprecated `/api/sync/*` compatibility.
 *
 * The published docs describe uploads as a `{ changes: SyncChange[] }` batch, while we transfer one
 * addressed package per request under `/api/registry/transfer/*`. This module is the translation
 * boundary: it parses the documented request, hands the work to {@link applyTransferBatch} (the same
 * ingestion the canonical routes use), and formats the documented response. Nothing is validated or
 * persisted here, so deleting this file and its route drops the compatibility surface without
 * touching the transfer contract.
 *
 * The docs name `SyncChange` but never define its fields, so the shape below is ours: the thinnest
 * envelope around the canonical transfer packages. The documented payload list (components,
 * patterns, pages, source files, build artifacts, screenshots) needs no parallel model, since files,
 * artifacts and build metadata already travel inside `TransferPackage`.
 *
 * `GET /api/sync/status` and `GET /api/sync/changes` are deliberately left out. Both assume a cursor
 * and event-history subsystem we do not have, and inventing one would misreport the registry's state
 * rather than adapt it.
 */

/** One documented change. `create` and `update` are treated as synonyms for `upsert`. */
export interface SyncChange {
  op: TransferBatchOp | 'create' | 'update';
  kind: RegistryEntityKind;
  /** Entity id, token set id, or asset collection, depending on `kind`. */
  id: string;
  /** The canonical transfer package for an upsert; unused by `delete`. */
  package?: unknown;
}

/** The canonical route these operations superseded, for the `Link` header. */
const SUCCESSOR_ROUTE = '/api/registry/transfer';

const normalizeOp = (op: unknown): TransferBatchOp | undefined => {
  if (op === 'delete') return 'delete';
  if (op === 'upsert' || op === 'create' || op === 'update' || op === undefined) return 'upsert';
  return undefined;
};

/**
 * Mark a response as coming from a deprecated surface and point at its replacement.
 *
 * `Sunset` is left off on purpose: RFC 8594 wants a concrete HTTP-date, but removal is tied to a
 * release rather than a date, so the release notes carry it instead of a guessed header.
 */
export const sendDeprecationHeaders = (res: NextApiResponse, successor: string): void => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', `<${successor}>; rel="successor-version"`);
};

interface ParsedChanges {
  ok: boolean;
  items?: TransferBatchItem[];
  message?: string;
  rejectedFields?: string[];
}

/** Parse the documented `{ changes: SyncChange[] }` body into canonical batch items. */
export const parseSyncChanges = (body: unknown): ParsedChanges => {
  if (!isPlainObject(body) || !Array.isArray(body.changes)) {
    return { ok: false, message: 'Request body must be a JSON object with a `changes` array.', rejectedFields: ['changes'] };
  }

  const items: TransferBatchItem[] = [];
  for (const [index, raw] of body.changes.entries()) {
    const field = `changes[${index}]`;
    if (!isPlainObject(raw)) {
      return { ok: false, message: `${field} must be an object.`, rejectedFields: [field] };
    }

    const op = normalizeOp(raw.op);
    if (!op) {
      return { ok: false, message: `${field}.op must be one of create|update|upsert|delete.`, rejectedFields: [`${field}.op`] };
    }
    if (typeof raw.kind !== 'string' || !isRegistryEntityKind(raw.kind)) {
      return {
        ok: false,
        message: `${field}.kind must be one of components|patterns|pages|tokens|assets.`,
        rejectedFields: [`${field}.kind`],
      };
    }
    if (typeof raw.id !== 'string' || raw.id.length === 0) {
      return { ok: false, message: `${field}.id is required.`, rejectedFields: [`${field}.id`] };
    }
    // A missing package is malformed input, not a change that failed to apply, so reject the whole
    // request like the structural defects above instead of reporting it in a 207.
    if (op === 'upsert' && raw.package === undefined) {
      return { ok: false, message: `${field}.package is required for an upsert.`, rejectedFields: [`${field}.package`] };
    }

    items.push({ op, kind: raw.kind, id: raw.id, package: raw.package });
  }

  return { ok: true, items };
};

/** Report one item the way the documented `applied` / `failed` arrays describe it. */
const describeOutcome = (outcome: TransferBatchOutcome) => ({
  kind: outcome.item.kind,
  id: outcome.item.id,
  op: outcome.item.op,
  ...(outcome.unchanged ? { unchanged: true } : {}),
  ...(outcome.ok ? {} : { code: outcome.code, message: outcome.message }),
});

/**
 * `POST /api/sync/upload`, the deprecated batch upload.
 *
 * Runs behind the standard registry guard stack, so runtime mode, method, database availability and
 * the `registry:write` scope are enforced exactly as for a canonical transfer request. Responses use
 * the documented envelope rather than the registry `{ data, meta }` one, and a partial batch answers
 * `207`, a status the shared error vocabulary intentionally does not carry, which is why it is
 * written here instead of through `sendRegistryError`.
 *
 * Asset uploads still need their blobs stored first through
 * `/api/registry/transfer/assets/blobs/*`; a manifest referencing missing content is rejected per
 * change rather than finalized.
 */
export const handleSyncUploadRoute = (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  sendDeprecationHeaders(res, SUCCESSOR_ROUTE);
  return handleRegistryRoute(req, res, ['POST'], async ({ db }) => {
    const parsed = parseSyncChanges(req.body);
    if (!parsed.ok || !parsed.items) {
      sendRegistryError(res, 'bad_request', parsed.message ?? 'Invalid sync upload body.', {
        rejectedFields: parsed.rejectedFields,
      });
      return;
    }

    const { applied, failed } = await applyTransferBatch(db, parsed.items);

    // A batch mutates the registry like anything else, so the docs pages it touched are regenerated
    // the same way a single-entity transfer does. Token and asset sets have no per-entity page, so
    // only entities are collected here.
    await revalidateEntityBatch(
      res,
      applied
        .filter((outcome) => outcome.item.kind !== 'tokens' && outcome.item.kind !== 'assets' && !outcome.unchanged)
        .map((outcome) => ({
          kind: ENTITY_WIRE_KIND[outcome.item.kind as Exclude<RegistryEntityKind, 'tokens' | 'assets'>] as RevalidatableEntityKind,
          id: outcome.item.id,
        }))
    );

    const appliedBody = applied.map(describeOutcome);

    if (failed.length === 0) {
      res.status(200).json({ ok: true, appliedCount: appliedBody.length, applied: appliedBody });
      return;
    }

    res.status(207).json({
      error: `${failed.length} of ${parsed.items.length} change(s) failed to apply.`,
      applied: appliedBody,
      failed: failed.map(describeOutcome),
    });
  });
};
