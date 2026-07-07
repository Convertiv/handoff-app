/**
 * Connected-workspace token checkout orchestration.
 *
 * `checkout tokens [setId]` pulls published token sets from the connected registry into this
 * workspace: it reconstructs the canonical local `tokens.json` (splicing each set's record into the
 * document) and restores the generated token files (CSS/SCSS/Style Dictionary/types/custom) to their
 * standard configured output paths under `getVariablesFilePath()`. Overwriting changed local token
 * data requires `--force` or an interactive confirmation. Available only from a connected workspace.
 */

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import { Types as CoreTypes } from 'handoff-core';
import Handoff from '../../index';
import { Logger } from '../../utils/logger';
import { createRegistryClient, RegistryClientError } from '../client';
import { mergeTokenSetsIntoDocument, type DerivedTokenSet } from '../tokens/sets';
import type { TokenSetCheckoutPayload } from '../tokens/transfer';
import { CheckoutError, resolveConnectionOrThrow } from './index';

/** Map a registry client error to an actionable checkout message. */
const describeFetchFailure = (error: RegistryClientError, target: string, registryUrl: string): string => {
  switch (error.code) {
    case 'not_found':
      return `No token set "${target}" exists in the registry at ${registryUrl}.`;
    case 'runtime_mode_conflict':
      return `The registry at ${registryUrl} is not running in registry mode, so it cannot serve a checkout: ${error.message}`;
    case 'unauthorized':
      return `The registry rejected the access token (401). Check the configured access token matches the registry's token.`;
    default:
      return error.message;
  }
};

/** Read the existing local token document, or `null` when none exists yet. */
const readExistingDocument = (handoff: Handoff): CoreTypes.IDocumentationObject | null => {
  const tokensFilePath = handoff.getTokensFilePath();
  if (!fs.existsSync(tokensFilePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(tokensFilePath, 'utf8')) as CoreTypes.IDocumentationObject;
  } catch {
    return null;
  }
};

/** A generated artifact to restore, resolved to its absolute local output path. */
interface ArtifactWrite {
  absolutePath: string;
  content: string;
}

/** Whether writing `content` to `absolutePath` would change (or create) the file. */
const wouldChange = (absolutePath: string, content: string): boolean => {
  if (!fs.existsSync(absolutePath)) {
    return true;
  }
  try {
    return fs.readFileSync(absolutePath, 'utf8') !== content;
  } catch {
    return true;
  }
};

/**
 * Checkout all published token sets, or a single set when `setId` is given. Reconstructs `tokens.json`
 * and restores generated files; prompts before overwriting changed local files unless `--force`.
 */
export const checkoutTokens = async (handoff: Handoff, setId?: string): Promise<void> => {
  const connection = resolveConnectionOrThrow(handoff);
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });

  let ids: string[];
  if (setId) {
    ids = [setId];
  } else {
    const summaries = await client.listTokenSets();
    ids = summaries.map((summary) => summary.id);
    if (ids.length === 0) {
      Logger.info('No token sets are published to the registry; nothing to checkout.');
      return;
    }
  }

  const payloads: TokenSetCheckoutPayload[] = [];
  for (const id of ids) {
    try {
      payloads.push(await client.checkoutTokens(id));
    } catch (error) {
      if (error instanceof RegistryClientError) {
        throw new CheckoutError(describeFetchFailure(error, id, connection.url));
      }
      throw error;
    }
  }

  const existingDoc = readExistingDocument(handoff);
  const sets: DerivedTokenSet[] = payloads.map((payload) => ({ id: payload.id, kind: payload.kind, record: payload.record }));
  const mergedDoc = mergeTokenSetsIntoDocument(existingDoc, sets);
  const mergedDocContent = `${JSON.stringify(mergedDoc, null, 2)}\n`;

  const variablesDir = handoff.getVariablesFilePath();
  const artifactWrites: ArtifactWrite[] = payloads.flatMap((payload) =>
    payload.artifacts.map((artifact) => ({
      absolutePath: path.resolve(variablesDir, ...artifact.path.split('/')),
      content: artifact.content,
    }))
  );

  const tokensFilePath = handoff.getTokensFilePath();
  const changed: string[] = [];
  if (wouldChange(tokensFilePath, mergedDocContent)) {
    changed.push(tokensFilePath);
  }
  for (const write of artifactWrites) {
    if (wouldChange(write.absolutePath, write.content)) {
      changed.push(write.absolutePath);
    }
  }

  const existingChanges = changed.filter((filePath) => fs.existsSync(filePath));
  if (existingChanges.length > 0 && !handoff.force) {
    const proceed = await p.confirm({
      message: `Checkout will overwrite ${existingChanges.length} changed local token file(s). Continue?`,
    });
    if (p.isCancel(proceed) || proceed !== true) {
      Logger.info('Token checkout cancelled; no files were written.');
      return;
    }
  }

  await fs.ensureDir(path.dirname(tokensFilePath));
  await fs.writeFile(tokensFilePath, mergedDocContent);
  for (const write of artifactWrites) {
    await fs.ensureDir(path.dirname(write.absolutePath));
    await fs.writeFile(write.absolutePath, write.content);
  }

  Logger.success(
    `Checked out ${ids.length} token set(s) into ${tokensFilePath} (${artifactWrites.length} generated file(s) restored).`
  );
};
