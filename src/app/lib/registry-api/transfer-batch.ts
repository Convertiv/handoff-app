import type { RegistryDatabase } from '@handoff/registry/db/client';
import type { RegistryEntityKind } from '@handoff/registry/content-kinds';
import { ENTITY_WIRE_KIND } from '@handoff/registry/content-kinds';
import { applyAssetCollectionPackage } from './asset-transfer';
import type { RegistryErrorCode } from './errors';
import { deleteEntity } from './store';
import { applyTokenSetPackage } from './token-transfer';
import { applyEntityPackage } from './transfer';
import type { ApplyResult } from './validation';

/**
 * Batch transfer application.
 *
 * The per-kind `apply*` functions each own one kind's validation and ingestion; this composes them
 * into a mixed-kind batch. Every item is attempted, a failing item never aborts the rest, and the
 * caller gets both halves so it can decide how to report them. Ingestion is not duplicated here:
 * each item goes through the same service the single-entity transfer routes use, so the two cannot
 * drift apart.
 *
 * There is no batch-level atomicity by design. Each item commits in its own transaction, just like a
 * sequence of single-entity publishes.
 */

/** What a batch does with one item. `delete` removes an entity and the artifacts it owns. */
export type TransferBatchOp = 'upsert' | 'delete';

/** One unit of work in a batch: an operation on one addressed piece of content. */
export interface TransferBatchItem {
  op: TransferBatchOp;
  kind: RegistryEntityKind;
  /** Entity id, token set id, or asset collection, depending on `kind`. */
  id: string;
  /** The transfer package for an `upsert`; unused by `delete`. */
  package?: unknown;
}

/** One item's outcome, with enough identity for the caller to report it against the request. */
export interface TransferBatchOutcome {
  item: TransferBatchItem;
  ok: boolean;
  /** Set when the item was applied but the stored content already matched. */
  unchanged?: boolean;
  code?: RegistryErrorCode;
  message?: string;
}

export interface TransferBatchResult {
  applied: TransferBatchOutcome[];
  failed: TransferBatchOutcome[];
}

const failure = (item: TransferBatchItem, code: RegistryErrorCode, message: string): TransferBatchOutcome => ({
  item,
  ok: false,
  code,
  message,
});

/** Carry a failed {@link ApplyResult} through as this item's outcome. */
const toFailure = (item: TransferBatchItem, result: ApplyResult<unknown>): TransferBatchOutcome =>
  failure(item, result.code ?? 'bad_request', result.message ?? 'The registry rejected this change.');

/** Apply one batch item through the same service its single-item transfer route uses. */
const applyItem = async (db: RegistryDatabase, item: TransferBatchItem): Promise<TransferBatchOutcome> => {
  const { op, kind, id } = item;

  if (op === 'delete') {
    // Only entities can be removed. Token sets and asset collections have no deletion path, and
    // saying so beats silently treating the request as a no-op.
    if (kind === 'tokens' || kind === 'assets') {
      return failure(item, 'bad_request', `Deleting ${kind} is not supported; publish a replacement instead.`);
    }
    const deleted = await deleteEntity(db, ENTITY_WIRE_KIND[kind], id);
    return deleted ? { item, ok: true } : failure(item, 'not_found', `No ${kind.slice(0, -1)} "${id}" exists in the registry.`);
  }

  // Defensive: HTTP callers reject this at parse time, but this service is callable directly.
  if (item.package === undefined) {
    return failure(item, 'bad_request', 'An upsert requires a transfer package.');
  }

  if (kind === 'tokens') {
    const result = await applyTokenSetPackage(db, id, item.package);
    return result.ok ? { item, ok: true, unchanged: result.value?.unchanged } : toFailure(item, result);
  }
  if (kind === 'assets') {
    const result = await applyAssetCollectionPackage(db, id, item.package);
    return result.ok ? { item, ok: true, unchanged: result.value?.unchanged } : toFailure(item, result);
  }

  const result = await applyEntityPackage(db, ENTITY_WIRE_KIND[kind], id, item.package);
  return result.ok ? { item, ok: true } : toFailure(item, result);
};

/**
 * Apply every item in order, keeping successes and failures apart. An item that throws is recorded as
 * a failure instead of aborting the batch, so one malformed package cannot discard work that already
 * succeeded.
 */
export const applyTransferBatch = async (db: RegistryDatabase, items: TransferBatchItem[]): Promise<TransferBatchResult> => {
  const applied: TransferBatchOutcome[] = [];
  const failed: TransferBatchOutcome[] = [];

  for (const item of items) {
    let outcome: TransferBatchOutcome;
    try {
      outcome = await applyItem(db, item);
    } catch (error) {
      console.error('Transfer batch item failed.', error);
      outcome = failure(item, 'unexpected_error', error instanceof Error ? error.message : String(error));
    }
    (outcome.ok ? applied : failed).push(outcome);
  }

  return { applied, failed };
};
