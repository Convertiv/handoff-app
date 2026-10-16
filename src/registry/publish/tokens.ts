/**
 * Connected-workspace token publish orchestration.
 *
 * `publish tokens [setId...]` runs a **fresh token build** (`handoff.fetch()` — Figma extract +
 * `buildStyles`) so the local `tokens.json` and generated token outputs are current, discovers the
 * logical sets from that document, then uploads each selected set (its extracted record + generated
 * artifacts) to the connected registry. Each set is one atomic upsert; a set whose deterministic
 * `sourceHash` matches the registry's is skipped. Absent sets are never deleted (explicit deletion is
 * a separate management action).
 */

import Handoff from '../../index';
import type { TokenSetRecord } from '../../store/types';
import { Logger } from '../../utils/logger';
import { stableStringify } from '../../utils/stable-stringify';
import { selectIds } from '../selection';
import type { TokenSetSummary, TokenSetTransferArtifact, TokenSetTransferPackage } from '../tokens/transfer';
import { describePublishError } from './errors';
import { PublishError, publishedLabel, resolveTransport } from './index';
import { createCurrentBuild, hashPathValues, sha256 } from './publish-build';

/**
 * Deterministic content hash for a token set: the key-order-independent record serialization plus the
 * path-sorted artifact bytes. Independent of JSON key insertion order, so an unchanged set hashes the
 * same across rebuilds and skip-unchanged works reliably.
 */
const hashTokenSet = (record: unknown, artifacts: TokenSetTransferArtifact[]): string => {
  return hashPathValues(
    artifacts.map((artifact) => ({ path: artifact.path, value: artifact.content })),
    stableStringify(record)
  );
};

/** Assemble one set's publish package from the freshly generated local token output. */
const buildTokenSetPackage = async (handoff: Handoff, set: TokenSetRecord): Promise<TokenSetTransferPackage> => {
  const artifacts: TokenSetTransferArtifact[] = (await handoff.store.tokens.getArtifacts(set.id)).map((artifact) => ({
    path: artifact.path,
    format: artifact.format,
    content: artifact.content,
    contentType: artifact.contentType,
    hash: sha256(artifact.content),
    size: Buffer.byteLength(artifact.content, 'utf8'),
  }));

  return {
    id: set.id,
    kind: set.kind,
    record: set.record,
    artifacts,
    build: createCurrentBuild({ sourceHash: hashTokenSet(set.record, artifacts) }),
  };
};

/**
 * Publish all discovered token sets, or a single set when `setId` is given. Runs a fresh token build,
 * skips sets whose content is unchanged on the registry, and reports published/unchanged/failed
 * counts. A per-set upload failure is collected and never leaves a partially written set (each set is
 * committed atomically server-side); the run throws at the end if any set failed.
 */
export const publishTokens = async (handoff: Handoff, selection?: string[]): Promise<void> => {
  const { client, url } = await resolveTransport(handoff);

  if (!handoff.skipBuild) {
    Logger.info(selection ? `Building tokens to publish ${selection.map((id) => `"${id}"`).join(', ')}…` : 'Building tokens for publish…');
    await handoff.fetch();
  }

  const allSets = await handoff.store.tokens.listSets();
  const { selected, unknown } = selectIds(
    allSets.map((set) => set.id),
    selection
  );
  if (unknown.length > 0) {
    throw new PublishError(
      `Token set ${unknown.map((id) => `"${id}"`).join(', ')} was not found in the generated tokens. ` +
        `Discovered sets: ${allSets.map((set) => set.id).join(', ') || '(none)'}.`
    );
  }
  const selectedIds = new Set(selected);
  const targetSets = allSets.filter((set) => selectedIds.has(set.id));

  const packages = await Promise.all(targetSets.map((set) => buildTokenSetPackage(handoff, set)));

  // Without a registry there is nothing to compare against, so a dry run reports every set.
  let remote: TokenSetSummary[] = [];
  if (client) {
    try {
      remote = await client.listTokenSets();
    } catch (error) {
      // If the summary listing fails we simply publish everything (the server still no-ops unchanged sets).
      Logger.info('Could not read current registry token sets; publishing all selected sets.');
    }
  }
  const remoteHashById = new Map(remote.map((entry) => [entry.id, entry.sourceHash]));

  let published = 0;
  let unchanged = 0;
  const failed: { id: string; message: string }[] = [];

  for (const pkg of packages) {
    const remoteHash = remoteHashById.get(pkg.id);
    if (remoteHash && remoteHash === pkg.build.sourceHash) {
      unchanged += 1;
      Logger.info(`Unchanged: ${pkg.id}`);
      continue;
    }
    try {
      if (client) {
        await client.publishTokens(pkg);
      }
      published += 1;
      Logger.info(`${publishedLabel(handoff)}: ${pkg.id} (${pkg.artifacts.length} artifact(s))`);
    } catch (error) {
      failed.push({ id: pkg.id, message: describePublishError(error, url, 'token set') });
    }
  }

  Logger.success(
    `Tokens publish complete — ${published} ${handoff.dryRun ? 'would be published' : 'published'}, ` +
      `${unchanged} unchanged${failed.length ? `, ${failed.length} failed` : ''}.`
  );
  if (failed.length > 0) {
    for (const failure of failed) {
      Logger.error(`  - ${failure.id}: ${failure.message}`);
    }
    throw new PublishError(`${failed.length} token set(s) failed to publish.`);
  }
};
