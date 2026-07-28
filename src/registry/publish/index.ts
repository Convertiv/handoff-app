/**
 * Connected-workspace publish orchestration.
 *
 * `publish <components|patterns|pages> <id>` prepares one entity and uploads its record, source files,
 * applicable rendered artifacts, and build metadata through the shared registry client.
 *
 * The build is targeted: a component builds the global artifacts + that component; a pattern builds
 * the global artifacts + the components it composes + the pattern itself. This is the smallest build
 * that still guarantees the entity's artifacts (and the shared artifacts they reference) are current.
 */

import Handoff from '../../index';
import { buildMainCss } from '../../transformers/preview/component/css';
import { buildMainJS } from '../../transformers/preview/component/javascript';
import processComponents from '../../transformers/preview/component/builder';
import { processPatterns } from '../../transformers/preview/pattern/builder';
import { Logger } from '../../utils/logger';
import { createRegistryClient, RegistryClientError } from '../client';
import { resolveAuthenticatedRegistryConnection } from '../connection';
import type { EntitySummary, TransferEntityKind } from '../transfer';
import { describeUploadFailure } from './errors';
import { assertRequiredArtifactsPresent, buildPublishPackage, PublishPackageError } from './package';

/** A connected-workspace configuration or precondition failure surfaced to the CLI. */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishError';
  }
}

/**
 * Ensure the workspace is a connected workspace able to publish: workspace runtime mode (registry
 * hosts do not publish) and a resolved registry URL + access token. Throws an actionable
 * {@link PublishError} naming the exact misconfiguration.
 */
export const resolveConnectionOrThrow = async (handoff: Handoff) => {
  const mode = handoff.config?.runtime?.mode ?? 'workspace';
  if (mode !== 'workspace') {
    throw new PublishError(
      `publish is only available from a connected workspace (runtime.mode: "workspace"); this project is "${mode}". ` +
        'A registry host stores and serves what was published to it; it does not publish.'
    );
  }

  const connection = await resolveAuthenticatedRegistryConnection(handoff.config, handoff.workingPath);
  if (!connection.url) {
    throw new PublishError(
      `No registry is configured. Run \`handoff-app login --url <registry-url>\`, set runtime.registryConnection.url, ` +
        `or set the "${connection.urlEnv}" environment variable to the base URL of the registry to publish to.`
    );
  }
  if (!connection.accessToken) {
    throw new PublishError(
      `No registry access token is configured. Run \`handoff-app login --url ${connection.url}\`, or set the ` +
        `"${connection.accessTokenEnv}" environment variable to a user-issued token for CI.`
    );
  }
  return connection;
};

/** Run the smallest build that guarantees the selected entity's artifacts are current. */
const runTargetedBuild = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<void> => {
  // Pages carry no rendered artifacts (raw markdown is rendered at runtime), so there is nothing to
  // build — the package is assembled directly from the discovered page record + its `.md`.
  if (kind === 'page') {
    if (!handoff.runtimeConfig?.entries?.pages?.[id]) {
      throw new PublishPackageError(`Page "${id}" is not declared in this workspace.`);
    }
    return;
  }

  // Global artifacts first so generated HTML references `component/main.{css,js}` / `shared.css` only
  // when they actually exist.
  await buildMainJS(handoff);
  await buildMainCss(handoff);

  if (kind === 'component') {
    if (!handoff.runtimeConfig?.entries?.components?.[id]) {
      throw new PublishPackageError(`Component "${id}" is not declared in this workspace.`);
    }
    await processComponents(handoff, id);
    return;
  }

  const pattern = handoff.runtimeConfig?.entries?.patterns?.[id];
  if (!pattern) {
    throw new PublishPackageError(`Pattern "${id}" is not declared in this workspace.`);
  }
  // A pattern composes pre-built component preview HTML, so build the components it references first,
  // then compose just this pattern.
  const referencedComponentIds = new Set(pattern.components.map((ref) => ref.id));
  for (const componentId of Array.from(referencedComponentIds)) {
    if (handoff.runtimeConfig?.entries?.components?.[componentId]) {
      await processComponents(handoff, componentId);
    }
  }
  await processPatterns(handoff, { onlyPatternIds: new Set([id]) });
};

/**
 * Publish a single component, pattern, or page from a connected workspace. Components and patterns
 * receive a targeted build, while pages are packaged directly from their source.
 */
export const publishEntity = async (handoff: Handoff, kind: TransferEntityKind, id: string): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);

  Logger.info(kind === 'page' ? `Preparing page "${id}" for publish…` : `Building ${kind} "${id}" for publish…`);
  await runTargetedBuild(handoff, kind, id);

  const pkg = await buildPublishPackage(handoff, kind, id);
  assertRequiredArtifactsPresent(pkg);

  Logger.info(
    `Uploading ${kind} "${id}" to ${connection.url} (${pkg.artifacts.length} artifact(s), ${pkg.files.length} source file(s))…`
  );
  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });
  try {
    await client.publish(kind, id, pkg);
  } catch (error) {
    if (error instanceof RegistryClientError) {
      throw new PublishError(describeUploadFailure(error, connection.url, 'package'));
    }
    throw error;
  }

  Logger.success(`Published ${kind} "${id}" to the registry.`);
};

/** The published-content hash a bulk publish compares for skip-unchanged (artifact for rendered kinds, source for pages). */
const entityHash = (value: { artifactHash?: string; sourceHash?: string }): string | undefined => value.artifactHash ?? value.sourceHash;

/**
 * Run one build covering every entity of the kind, so a bulk publish builds once instead of per id.
 * Pages carry no rendered artifacts. Components need the global artifacts + all components; patterns
 * additionally need all patterns composed (each references pre-built component HTML).
 */
const runBulkBuild = async (handoff: Handoff, kind: TransferEntityKind): Promise<void> => {
  if (kind === 'page') {
    return;
  }
  await buildMainJS(handoff);
  await buildMainCss(handoff);
  await processComponents(handoff);
  if (kind === 'pattern') {
    await processPatterns(handoff);
  }
};

/** List every declared entity id of the kind from the workspace store. */
const listWorkspaceEntityIds = async (handoff: Handoff, kind: TransferEntityKind): Promise<string[]> => {
  const store = kind === 'component' ? handoff.store.components : kind === 'pattern' ? handoff.store.patterns : handoff.store.pages;
  return (await store.list()).map((entity) => entity.id);
};

/**
 * Publish every component, pattern, or page declared in this connected workspace. Builds the kind
 * once, assembles each entity's package, skips entities whose content hash already matches the
 * registry (unless `--force`), and reports published/unchanged/failed counts. A per-entity failure is
 * collected and never aborts the rest; the run throws at the end if any entity failed.
 */
export const publishEntities = async (handoff: Handoff, kind: TransferEntityKind): Promise<void> => {
  const connection = await resolveConnectionOrThrow(handoff);

  Logger.info(`Building ${kind}s for publish…`);
  await runBulkBuild(handoff, kind);

  const ids = await listWorkspaceEntityIds(handoff, kind);
  if (ids.length === 0) {
    Logger.success(`No ${kind}s are declared in this workspace; nothing to publish.`);
    return;
  }

  const client = createRegistryClient({ baseUrl: connection.url, accessToken: connection.accessToken });
  let remote: EntitySummary[] = [];
  if (!handoff.force) {
    try {
      remote = await client.listEntities(kind);
    } catch {
      // If the summary listing fails we simply publish everything (the server still overwrites in place).
      Logger.info(`Could not read current registry ${kind}s; publishing all.`);
    }
  }
  const remoteHashById = new Map(remote.map((entry) => [entry.id, entityHash(entry)]));

  let published = 0;
  let unchanged = 0;
  const failed: { id: string; message: string }[] = [];

  for (const id of ids) {
    try {
      const pkg = await buildPublishPackage(handoff, kind, id);
      assertRequiredArtifactsPresent(pkg);

      const remoteHash = remoteHashById.get(id);
      const localHash = entityHash(pkg.build);
      if (!handoff.force && remoteHash && localHash && remoteHash === localHash) {
        unchanged += 1;
        Logger.info(`Unchanged: ${id}`);
        continue;
      }

      await client.publish(kind, id, pkg);
      published += 1;
      Logger.info(`Published: ${id} (${pkg.artifacts.length} artifact(s), ${pkg.files.length} source file(s))`);
    } catch (error) {
      const message =
        error instanceof RegistryClientError
          ? describeUploadFailure(error, connection.url, 'package')
          : error instanceof Error
            ? error.message
            : String(error);
      failed.push({ id, message });
    }
  }

  Logger.success(
    `${kind[0].toUpperCase()}${kind.slice(1)}s publish complete — ${published} published, ${unchanged} unchanged${failed.length ? `, ${failed.length} failed` : ''}.`
  );
  if (failed.length > 0) {
    for (const failure of failed) {
      Logger.error(`  - ${failure.id}: ${failure.message}`);
    }
    throw new PublishError(`${failed.length} ${kind}(s) failed to publish.`);
  }
};
